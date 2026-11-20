import { configureStore } from "@reduxjs/toolkit";
import { api } from "./api";
import { chatReducer } from "./chat-state";

export const createStore = () =>
  configureStore({
    reducer: { chat: chatReducer, [api.reducerPath]: api.reducer },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });
export type Store = ReturnType<typeof createStore>;
export type RootState = ReturnType<Store["getState"]>;
export type Dispatch = Store["dispatch"];
