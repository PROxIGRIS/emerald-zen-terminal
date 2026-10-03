import { createFileRoute } from "@tanstack/react-router";
import AdminTerminal from "@/components/terminal/AdminTerminal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Admin Terminal — Obylon" },
      {
        name: "description",
        content: "Obylon operator terminal for endpoint commands and diagnostics.",
      },
      { property: "og:title", content: "Admin Terminal — Obylon" },
      {
        property: "og:description",
        content: "Obylon operator terminal for endpoint commands and diagnostics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <AdminTerminal mode="light" />;
}
