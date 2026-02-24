/**
 * OpenAPI 3.0 Specification for ProsektorWeb Dashboard API
 * 
 * This file assembles the complete API specification from modular components.
 * Auto-generated documentation is served via Scalar at /api/docs/ui
 */

import { openApiInfo } from './info';
import { securitySchemes, sharedParameters, sharedSchemas, standardResponses } from './components';
import {
    authPaths,
    userPaths,
    dashboardPaths,
    analyticsPaths,
    inboxPaths,
    contentPaths,
    sitesPaths,
    domainsPaths,
    modulesPaths,
    teamPaths,
    hrPaths,
    publishingPaths,
    publicPaths,
    adminPaths,
} from './paths';

export const openApiSpec = {
    ...openApiInfo,
    paths: {
        ...authPaths,
        ...userPaths,
        ...dashboardPaths,
        ...analyticsPaths,
        ...inboxPaths,
        ...contentPaths,
        ...sitesPaths,
        ...domainsPaths,
        ...modulesPaths,
        ...teamPaths,
        ...hrPaths,
        ...publishingPaths,
        ...publicPaths,
        ...adminPaths,
    },
    components: {
        securitySchemes,
        parameters: sharedParameters,
        schemas: sharedSchemas,
        responses: standardResponses,
    },
} as const;
