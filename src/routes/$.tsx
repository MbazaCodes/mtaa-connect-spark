import { createFileRoute } from "@tanstack/react-router";
import { ClonedApp } from "@/cloned-app-mount";

export const Route = createFileRoute("/$")({
  component: ClonedApp,
});
