import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // Always allow access to the login route so it doesn't loop redirects
      if (req.nextUrl.pathname === "/admin/login") {
        return true;
      }
      // Require token session for any other matches routes
      return !!token;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
});

export const config = {
  // Protect all routes under the /admin namespace
  matcher: ["/admin/:path*"],
};
