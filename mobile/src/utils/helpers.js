import { workspaceServiceConfig } from './constants';

export const getChartServiceEndpoint = () => {
  const { baseDomain, apiVersion } = workspaceServiceConfig;
  return `https://${baseDomain}/${apiVersion}`;
};
