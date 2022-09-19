import React from 'react';

/*
 * "customday" is a user-customizable view (they can change the number of days
 * to display)
 */
const supportedViews = ['day', 'week', 'month', 'year', 'customday'] as const;
type SupportedView = typeof supportedViews[number];

type CurrentView = {
  readonly view: SupportedView;
  readonly date: Date;
};

export function TrackCurrentView({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  const [currentView, setCurrentView] = React.useState<CurrentView | undefined>(
    undefined
  );

  useCurrentTracker(setCurrentView);

  return (
    <CurrentViewContext.Provider value={currentView}>
      {children}
    </CurrentViewContext.Provider>
  );
}

/**
 * Listen for changes to current URL
 */
function useCurrentTracker(
  setCurrentView: (newCurrentView: CurrentView | undefined) => void
) {
  React.useEffect(() => {
    let lastPath = '';

    const parseUrl = () => setCurrentView(parsePath(window.location.pathname));
    // Parse initial URL
    parseUrl();

    function handleUpdate(request: { readonly message: string }) {
      if (request.message !== 'tabUpdate') return;
      if (window.location.pathname === lastPath) return;
      lastPath = window.location.pathname;
      parseUrl();
    }

    // Listen for message from ../Background/index.ts
    chrome.runtime.onMessage.addListener(handleUpdate);
    return (): void => chrome.runtime.onMessage.removeListener(handleUpdate);
  }, [setCurrentView]);
}

const commonPrefix = `/calendar/u/0/r/`;

/**
 * Extract current date from the Google Calendar URL
 */
function parsePath(path: string): CurrentView | undefined {
  if (!path.startsWith(commonPrefix)) return undefined;
  const [rawView, ...date] = path.slice(commonPrefix.length).split('/');
  // Make it more type safe
  const viewName = rawView as SupportedView;
  if (!supportedViews.includes(viewName)) return undefined;
  const year = date[0] || new Date().getFullYear().toString();
  const month = date[1] || new Date().getMonth().toString();
  const day = date[2] || new Date().getDate().toString();
  return {
    view: viewName,
    date: new Date(
      Number.parseInt(year),
      Number.parseInt(month),
      Number.parseInt(day)
    ),
  };
}

export const CurrentViewContext = React.createContext<CurrentView | undefined>(
  undefined
);
CurrentViewContext.displayName = 'LoadingContext';

export const exportsForTests = {
  parsePath,
};
