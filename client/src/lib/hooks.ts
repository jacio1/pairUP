import { useDispatch, useSelector } from "react-redux";
import type { Dispatch, RootState } from "./store";
export const useAppDispatch = useDispatch.withTypes<Dispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
