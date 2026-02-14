import { GET as hrApplicationsHandler } from "../hr-applications/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Delegate directly to the HR applications handler
// This avoids HTTP redirects which can cause Mixed Content errors
// if the container's internal IP (0.0.0.0) leaks into the Location header.
export { hrApplicationsHandler as GET };
