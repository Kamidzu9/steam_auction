"use client";

import ServiceWorkerRegister from "./ServiceWorkerRegister";
import InstallPrompt from "./InstallPrompt";

export default function ClientHelpers() {
  return (
    <>
      <ServiceWorkerRegister />
      <InstallPrompt />
    </>
  );
}
