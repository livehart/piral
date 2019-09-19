import * as React from 'react';
import { withRecall, ApiCreator, createProgressiveStrategy } from 'react-arbiter';
import { Portal } from './components';
import { createGlobalState, createActions, StateContext } from './state';
import { getLocalDependencies, createListener, globalDependencies, mergeApis } from './modules';
import { PiletApi, PiralConfiguration, PortalProps, PiralInstance, PiletMetadata, GlobalStateContext, Extend } from './types';

function defaultModuleRequester(): Promise<Array<PiletMetadata>> {
  return Promise.resolve([]);
}

function defaultApiCreator(context: GlobalStateContext, apis: Array<Extend>): ApiCreator<PiletApi> {
  return target => mergeApis(target, context, apis);
}

/**
 * Creates a new PiralInstance component, which can be used for
 * bootstrapping the application easily.
 *
 * @example
```tsx
const Piral = createInstance({
  requestPilets() {
    return fetch(...);
  },
});

const App: React.FC = () => <Piral>{content => <Layout>{content}</Layout>}</Piral>;
render(<App />, document.querySelector('#app'));
```
 */
export function createInstance(config: PiralConfiguration): PiralInstance {
  const {
    state,
    availablePilets = [],
    extendApi = [],
    requestPilets = defaultModuleRequester,
    getDependencies = getLocalDependencies,
    async = false,
    actions,
  } = config;
  const globalState = createGlobalState(state);
  const events = createListener(globalState);
  const context = createActions(globalState, events, actions);

  if (process.env.DEBUG_PILET) {
    const { setup } = require(process.env.DEBUG_PILET);
    availablePilets.push({
      name: process.env.BUILD_PCKG_NAME || 'dbg',
      version: process.env.BUILD_PCKG_VERSION || '1.0.0',
      hash: '',
      setup,
    });
  }

  const createApi = defaultApiCreator(context, Array.isArray(extendApi) ? extendApi : [extendApi]);
  const RecallPortal = withRecall<PortalProps, PiletApi>(Portal, {
    modules: availablePilets,
    getDependencies,
    strategy: createProgressiveStrategy(async),
    dependencies: globalDependencies,
    fetchModules() {
      events.emit('load-start', {});
      let promise = requestPilets();

      if (process.env.DEBUG_PILET) {
        promise = promise.catch(() => []);
      }

      promise.then(modules =>
        events.emit('load-end', {
          modules,
        }),
      );

      return promise;
    },
    createApi,
  });

  const App: React.FC<PortalProps> = props => (
    <StateContext.Provider value={context}>
      <RecallPortal {...props} />
    </StateContext.Provider>
  );
  App.displayName = 'Piral';

  return {
    ...events,
    App,
    createApi,
    actions: context,
    root: createApi({
      name: 'root',
      version: process.env.BUILD_PCKG_VERSION || '1.0.0',
      hash: '',
    }),
  };
}
