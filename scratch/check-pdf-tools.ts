import { execSync } from "child_process";

try {
  console.log("Checking Python pdf tools...");
  const pyVersion = execSync("python --version").toString();
  console.log("Python:", pyVersion.trim());
} catch (e) {
  console.log("Python not found");
}

try {
  console.log("Checking Puppeteer / PDF modules in node_modules...");
  require.resolve("pdfkit");
  console.log("pdfkit installed");
} catch (e) {
  console.log("pdfkit not installed");
}

try {
  require.resolve("jspdf");
  console.log("jspdf installed");
} catch (e) {
  console.log("jspdf not installed");
}

try {
  require.resolve("puppeteer");
  console.log("puppeteer installed");
} catch (e) {
  console.log("puppeteer not installed");
}
