import { useDispatch, useSelector, useStore } from "react-redux";
import type { Dispatch, RootState, Store } from "./store";
export const useAppDispatch = useDispatch.withTypes<Dispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const useAppStore = useStore.withTypes<Store>();
