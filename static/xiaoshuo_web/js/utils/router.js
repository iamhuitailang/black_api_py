const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
  { path: "/", redirect: "/discover" },
  { path: "/shelf", component: ShelfPage, meta: { title: "书架" } },
  { path: "/discover", component: DiscoverPage, meta: { title: "书城" } },
  { path: "/category", component: CategoryPage, meta: { title: "分类" } },
  { path: "/detail/:id", component: DetailPage, meta: { title: "详情" } },
  { path: "/reader", component: ReaderPage, meta: { title: "阅读" } },
];

window.router = createRouter({
  history: createWebHashHistory(),
  routes,
});

window.router.afterEach((to) => {
  if (to.meta && to.meta.title) {
    document.title = to.meta.title + " - 小说阅读器";
  }
});
