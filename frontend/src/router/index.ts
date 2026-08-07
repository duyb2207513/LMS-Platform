import { createRouter, createWebHistory } from "vue-router";

const EmptyRoute = { render: () => null };

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: "/", component: EmptyRoute }]
});
