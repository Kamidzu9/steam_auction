"use client";

import ServiceWorkerRegister from "./ServiceWorkerRegister";
import InstallPrompt from "./InstallPrompt";
import Tutorial from "./Tutorial";

export default function ClientHelpers() {
  return (
    <>
      <ServiceWorkerRegister />
      <InstallPrompt />
      <Tutorial />
    </>
  );
}
