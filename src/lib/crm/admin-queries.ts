/**
 * CRM database query helpers.
 *
 * Previously contained `crmTable()` which was a workaround for when CRM
 * tables weren't in the generated Supabase types. Now that types have
 * been regenerated, all CRM tables are accessed directly via the typed
 * admin client: `admin.from("crm_contacts")`.
 */

import "server-only";
