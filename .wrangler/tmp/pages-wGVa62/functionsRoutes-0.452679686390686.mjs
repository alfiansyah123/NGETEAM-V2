import { onRequestOptions as __api_cloudflare_add_pages_domain_js_onRequestOptions } from "C:\\project\\Link Generator - Copy\\functions\\api\\cloudflare\\add-pages-domain.js"
import { onRequestPost as __api_cloudflare_add_pages_domain_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\cloudflare\\add-pages-domain.js"
import { onRequestOptions as __api_cloudflare_add_zone_js_onRequestOptions } from "C:\\project\\Link Generator - Copy\\functions\\api\\cloudflare\\add-zone.js"
import { onRequestPost as __api_cloudflare_add_zone_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\cloudflare\\add-zone.js"
import { onRequestOptions as __api_cloudflare_delete_zone_js_onRequestOptions } from "C:\\project\\Link Generator - Copy\\functions\\api\\cloudflare\\delete-zone.js"
import { onRequestPost as __api_cloudflare_delete_zone_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\cloudflare\\delete-zone.js"
import { onRequestOptions as __api_cloudflare_setup_dns_js_onRequestOptions } from "C:\\project\\Link Generator - Copy\\functions\\api\\cloudflare\\setup-dns.js"
import { onRequestPost as __api_cloudflare_setup_dns_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\cloudflare\\setup-dns.js"
import { onRequestOptions as __api_cloudflare_setup_worker_proxy_js_onRequestOptions } from "C:\\project\\Link Generator - Copy\\functions\\api\\cloudflare\\setup-worker-proxy.js"
import { onRequestPost as __api_cloudflare_setup_worker_proxy_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\cloudflare\\setup-worker-proxy.js"
import { onRequestOptions as __api_add_domain_js_onRequestOptions } from "C:\\project\\Link Generator - Copy\\functions\\api\\add-domain.js"
import { onRequestPost as __api_add_domain_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\add-domain.js"
import { onRequestPost as __api_add_team_member_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\add-team-member.js"
import { onRequestOptions as __api_change_password_js_onRequestOptions } from "C:\\project\\Link Generator - Copy\\functions\\api\\change-password.js"
import { onRequestPost as __api_change_password_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\change-password.js"
import { onRequestOptions as __api_delete_domain_js_onRequestOptions } from "C:\\project\\Link Generator - Copy\\functions\\api\\delete-domain.js"
import { onRequestPost as __api_delete_team_member_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\delete-team-member.js"
import { onRequestGet as __api_get_admin_password_js_onRequestGet } from "C:\\project\\Link Generator - Copy\\functions\\api\\get-admin-password.js"
import { onRequestGet as __api_get_clicks_report_js_onRequestGet } from "C:\\project\\Link Generator - Copy\\functions\\api\\get-clicks-report.js"
import { onRequestGet as __api_get_domains_js_onRequestGet } from "C:\\project\\Link Generator - Copy\\functions\\api\\get-domains.js"
import { onRequestGet as __api_get_recent_clicks_js_onRequestGet } from "C:\\project\\Link Generator - Copy\\functions\\api\\get-recent-clicks.js"
import { onRequestGet as __api_get_settings_js_onRequestGet } from "C:\\project\\Link Generator - Copy\\functions\\api\\get-settings.js"
import { onRequestGet as __api_get_smartlink_by_user_js_onRequestGet } from "C:\\project\\Link Generator - Copy\\functions\\api\\get-smartlink-by-user.js"
import { onRequestGet as __api_get_team_js_onRequestGet } from "C:\\project\\Link Generator - Copy\\functions\\api\\get-team.js"
import { onRequestOptions as __api_login_js_onRequestOptions } from "C:\\project\\Link Generator - Copy\\functions\\api\\login.js"
import { onRequestPost as __api_login_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\login.js"
import { onRequestOptions as __api_save_link_js_onRequestOptions } from "C:\\project\\Link Generator - Copy\\functions\\api\\save-link.js"
import { onRequestPost as __api_save_link_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\save-link.js"
import { onRequestPost as __api_save_settings_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\save-settings.js"
import { onRequestPost as __api_update_click_ip_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\update-click-ip.js"
import { onRequestPost as __api_update_team_member_js_onRequestPost } from "C:\\project\\Link Generator - Copy\\functions\\api\\update-team-member.js"
import { onRequest as __api_delete_domain_js_onRequest } from "C:\\project\\Link Generator - Copy\\functions\\api\\delete-domain.js"
import { onRequest as ____path___js_onRequest } from "C:\\project\\Link Generator - Copy\\functions\\[[path]].js"

export const routes = [
    {
      routePath: "/api/cloudflare/add-pages-domain",
      mountPath: "/api/cloudflare",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_cloudflare_add_pages_domain_js_onRequestOptions],
    },
  {
      routePath: "/api/cloudflare/add-pages-domain",
      mountPath: "/api/cloudflare",
      method: "POST",
      middlewares: [],
      modules: [__api_cloudflare_add_pages_domain_js_onRequestPost],
    },
  {
      routePath: "/api/cloudflare/add-zone",
      mountPath: "/api/cloudflare",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_cloudflare_add_zone_js_onRequestOptions],
    },
  {
      routePath: "/api/cloudflare/add-zone",
      mountPath: "/api/cloudflare",
      method: "POST",
      middlewares: [],
      modules: [__api_cloudflare_add_zone_js_onRequestPost],
    },
  {
      routePath: "/api/cloudflare/delete-zone",
      mountPath: "/api/cloudflare",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_cloudflare_delete_zone_js_onRequestOptions],
    },
  {
      routePath: "/api/cloudflare/delete-zone",
      mountPath: "/api/cloudflare",
      method: "POST",
      middlewares: [],
      modules: [__api_cloudflare_delete_zone_js_onRequestPost],
    },
  {
      routePath: "/api/cloudflare/setup-dns",
      mountPath: "/api/cloudflare",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_cloudflare_setup_dns_js_onRequestOptions],
    },
  {
      routePath: "/api/cloudflare/setup-dns",
      mountPath: "/api/cloudflare",
      method: "POST",
      middlewares: [],
      modules: [__api_cloudflare_setup_dns_js_onRequestPost],
    },
  {
      routePath: "/api/cloudflare/setup-worker-proxy",
      mountPath: "/api/cloudflare",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_cloudflare_setup_worker_proxy_js_onRequestOptions],
    },
  {
      routePath: "/api/cloudflare/setup-worker-proxy",
      mountPath: "/api/cloudflare",
      method: "POST",
      middlewares: [],
      modules: [__api_cloudflare_setup_worker_proxy_js_onRequestPost],
    },
  {
      routePath: "/api/add-domain",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_add_domain_js_onRequestOptions],
    },
  {
      routePath: "/api/add-domain",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_add_domain_js_onRequestPost],
    },
  {
      routePath: "/api/add-team-member",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_add_team_member_js_onRequestPost],
    },
  {
      routePath: "/api/change-password",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_change_password_js_onRequestOptions],
    },
  {
      routePath: "/api/change-password",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_change_password_js_onRequestPost],
    },
  {
      routePath: "/api/delete-domain",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_delete_domain_js_onRequestOptions],
    },
  {
      routePath: "/api/delete-team-member",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_delete_team_member_js_onRequestPost],
    },
  {
      routePath: "/api/get-admin-password",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_admin_password_js_onRequestGet],
    },
  {
      routePath: "/api/get-clicks-report",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_clicks_report_js_onRequestGet],
    },
  {
      routePath: "/api/get-domains",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_domains_js_onRequestGet],
    },
  {
      routePath: "/api/get-recent-clicks",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_recent_clicks_js_onRequestGet],
    },
  {
      routePath: "/api/get-settings",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_settings_js_onRequestGet],
    },
  {
      routePath: "/api/get-smartlink-by-user",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_smartlink_by_user_js_onRequestGet],
    },
  {
      routePath: "/api/get-team",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_team_js_onRequestGet],
    },
  {
      routePath: "/api/login",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_login_js_onRequestOptions],
    },
  {
      routePath: "/api/login",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_login_js_onRequestPost],
    },
  {
      routePath: "/api/save-link",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_save_link_js_onRequestOptions],
    },
  {
      routePath: "/api/save-link",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_save_link_js_onRequestPost],
    },
  {
      routePath: "/api/save-settings",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_save_settings_js_onRequestPost],
    },
  {
      routePath: "/api/update-click-ip",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_update_click_ip_js_onRequestPost],
    },
  {
      routePath: "/api/update-team-member",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_update_team_member_js_onRequestPost],
    },
  {
      routePath: "/api/delete-domain",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_delete_domain_js_onRequest],
    },
  {
      routePath: "/:path*",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [____path___js_onRequest],
    },
  ]