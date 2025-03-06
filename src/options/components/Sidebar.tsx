import {
  type SelectTabData,
  type SelectTabEvent,
  Tab,
  TabList,
} from "@fluentui/react-components";
import React from "react";

import { RouteContext, routes } from "../routes/routes";

export default (): JSX.Element => {
  const { route, setRoute } = React.useContext(RouteContext);

  return (
    <div className="flex-none w-60 px-1 py-3 border-r border-gray-30">
      <TabList
        defaultSelectedValue={route.key}
        vertical
        onTabSelect={(event: SelectTabEvent, data: SelectTabData) => {
          setRoute(routes[data.value as string]);
        }}>
        {Object.entries(routes).map(([key, route], index) => (
          <Tab key={index} value={key} icon={route.icon}>
            {route.title}
          </Tab>
        ))}
      </TabList>
    </div>
  );
};
