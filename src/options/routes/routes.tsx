import {
  bundleIcon,
  DrinkCoffeeFilled,
  DrinkCoffeeRegular,
  SettingsFilled,
  SettingsRegular,
} from "@fluentui/react-icons";
import React from "react";

import Coffee from "../pages/Coffee";
import Settings from "../pages/Settings";

const SettingsIcon = bundleIcon(SettingsFilled, SettingsRegular);
const DrinkCoffeeIcon = bundleIcon(DrinkCoffeeFilled, DrinkCoffeeRegular);

interface Route {
  key: string;
  title: string;
  icon: JSX.Element;
  page: JSX.Element;
}

interface RouteContextProps {
  route: Route;
  setRoute: React.Dispatch<React.SetStateAction<Route>>;
}

export const routes: Record<string, Route> = {
  Settings: {
    key: "Settings",
    title: "Settings",
    icon: <SettingsIcon />,
    page: <Settings />,
  },
  Coffee: {
    key: "Coffee",
    title: "Buy me a coffee",
    icon: <DrinkCoffeeIcon />,
    page: <Coffee />,
  },
};

export const RouteContext = React.createContext<RouteContextProps>(null as any);
