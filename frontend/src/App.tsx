import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "@/components/shared/AppLayout";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import ReviewWorkspacePage from "@/pages/review/ReviewWorkspacePage";
import HistoryPage from "@/pages/history/HistoryPage";
import HistoryDetailPage from "@/pages/history/HistoryDetailPage";
import MemoryDashboardPage from "@/pages/memory/MemoryDashboardPage";
import NotFoundPage from "@/pages/not-found/NotFoundPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "review",
        element: <ReviewWorkspacePage />,
      },
      {
        path: "history",
        element: <HistoryPage />,
      },
      {
        path: "history/:id",
        element: <HistoryDetailPage />,
      },
      {
        path: "memory",
        element: <MemoryDashboardPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
