import { swap, Atom } from '@dbeining/react-atom';
import { LayoutType, GlobalState, GlobalStateContext } from '../../types';

export function changeLayout(this: GlobalStateContext, ctx: Atom<GlobalState>, current: LayoutType) {
  swap(ctx, state => {
    this.emit('change-layout', {
      current,
      previous: state.app.layout.current,
    });
    return {
      ...state,
      app: {
        ...state.app,
        layout: {
          ...state.app.layout,
          current,
        },
      },
    };
  });
}

export function setLoading(this: GlobalStateContext, ctx: Atom<GlobalState>, loading: boolean) {
  swap(ctx, state => {
    this.emit('loading', {
      loading,
    });
    return {
      ...state,
      app: {
        ...state.app,
        loading,
      },
    };
  });
}

export function withAction(this: GlobalStateContext, ctx: Atom<GlobalState>, actionName: string, action: any) {
  ctx[actionName] = (...args) => action.call(this, ctx, ...args);
}

export function withActions(this: GlobalStateContext, ctx: Atom<GlobalState>, actions: any) {
  for (const actionName of Object.keys(actions)) {
    const action = actions[actionName];
    withAction.call(this, ctx, actionName, action);
  }
}
