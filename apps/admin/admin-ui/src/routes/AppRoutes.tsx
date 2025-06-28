import { Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";
import OverviewPage from "../pages/OverviewPage";
import NodesPage from "../pages/NodesPage";
import ServicesPage from "../pages/ServicesPage";
import UsersPage from "../pages/UsersPage";
import LoadBalancerPage from "../pages/LoadBalancerPage";
import LogsPage from "../pages/LogsPage";
import SecurityPage from "../pages/SecurityPage";
import DatabasePage from "../pages/DatabasePage";
import RedisPage from "../pages/RedisPage";
import MonitoringPage from "../pages/MonitoringPage";
import ConfigPage from "../pages/ConfigPage";
import { AppRoute } from "./routes";

const AppRoutes = () => (
  <Routes>
    <Route path={AppRoute.HOME} element={<Layout />}>
      <Route index element={<OverviewPage />} />
      <Route path={AppRoute.NODES} element={<NodesPage />} />
      <Route path={AppRoute.SERVICES} element={<ServicesPage />} />
      <Route path={AppRoute.USERS} element={<UsersPage />} />
      <Route path={AppRoute.LOAD_BALANCER} element={<LoadBalancerPage />} />
      <Route path={AppRoute.LOGS} element={<LogsPage />} />
      <Route path="/logs/:nodeId" element={<LogsPage />} />
      <Route path={AppRoute.SECURITY} element={<SecurityPage />} />
      <Route path={AppRoute.DATABASE} element={<DatabasePage />} />
      <Route path={AppRoute.REDIS} element={<RedisPage />} />
      <Route path={AppRoute.MONITORING} element={<MonitoringPage />} />
      <Route path={AppRoute.CONFIG} element={<ConfigPage />} />
      <Route path="*" element={<h2>404 - Page Not Found</h2>} />
    </Route>
  </Routes>
);

export default AppRoutes;
