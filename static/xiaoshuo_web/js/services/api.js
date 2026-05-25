const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8090"
  : "";

const API_PREFIX = API_BASE + "/api/xiaoshuo";

async function request(url, options = {}) {
  const fullUrl = url.startsWith("http") ? url : API_PREFIX + url;
  const defaultOpts = {
    headers: { "Content-Type": "application/json" },
  };
  const merged = { ...defaultOpts, ...options };
  if (options.body && typeof options.body === "object") {
    merged.body = JSON.stringify(options.body);
  }
  try {
    const res = await fetch(fullUrl, merged);
    const json = await res.json();
    return json;
  } catch (e) {
    return { code: 500, message: "网络错误: " + e.message, data: null };
  }
}

const Api = {
  get(url, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(url + (qs ? "?" + qs : ""), { method: "GET" });
  },
  post(url, data = {}) {
    return request(url, { method: "POST", body: data });
  },
  put(url, data = {}) {
    return request(url, { method: "PUT", body: data });
  },
  del(url) {
    return request(url, { method: "DELETE" });
  },

  novelList(params) { return this.get("/novel/list", params); },
  novelDetail(id) { return this.get("/novel/detail/" + id); },
  novelHot(limit = 10) { return this.get("/novel/hot", { limit }); },
  novelRecommend(limit = 10) { return this.get("/novel/recommend", { limit }); },
  novelFinished(limit = 10) { return this.get("/novel/finished", { limit }); },
  novelLatest(limit = 10) { return this.get("/novel/latest", { limit }); },
  novelRankClick(limit = 10) { return this.get("/novel/rank/click", { limit }); },
  novelRankRecommend(limit = 10) { return this.get("/novel/rank/recommend", { limit }); },
  novelRankNew(limit = 10) { return this.get("/novel/rank/new", { limit }); },
  novelSimilar(id, limit = 6) { return this.get("/novel/similar/" + id, { limit }); },

  chapterList(novelId, simple = true) { return this.get("/chapter/list/" + novelId, { simple }); },
  chapterDetail(id) { return this.get("/chapter/detail/" + id); },
  chapterPrev(novelId, chapterNo) { return this.get("/chapter/prev", { novel_id: novelId, chapter_no: chapterNo }); },
  chapterNext(novelId, chapterNo) { return this.get("/chapter/next", { novel_id: novelId, chapter_no: chapterNo }); },

  categoryList() { return this.get("/category/list"); },

  shelfList(params = {}) { return this.get("/shelf/list", params); },
  shelfStats() { return this.get("/shelf/stats"); },
  shelfGroups() { return this.get("/shelf/groups"); },
  shelfAdd(novelId, groupName = "默认分组") { return this.post("/shelf/create", { novel_id: novelId, group_name: groupName }); },
  shelfUpdate(id, data) { return this.put("/shelf/update/" + id, data); },
  shelfDelete(id) { return this.del("/shelf/delete/" + id); },

  readingLast(novelId) { return this.get("/reading/last", { novel_id: novelId }); },
  readingSave(data) { return this.post("/reading/save", data); },

  bookmarkList(novelId) { return this.get("/bookmark/list", novelId ? { novel_id: novelId } : {}); },
  bookmarkAdd(data) { return this.post("/bookmark/create", data); },
  bookmarkDelete(id) { return this.del("/bookmark/delete/" + id); },

  commentList(novelId, page = 1, pageSize = 20) { return this.get("/comment/list", { novel_id: novelId, page, page_size: pageSize }); },
  commentAdd(data) { return this.post("/comment/create", data); },

  bannerList() { return this.get("/banner/list"); },

  offlineList(novelId) { return this.get("/offline/list", novelId ? { novel_id: novelId } : {}); },
  offlineCache(data) { return this.post("/offline/cache", data); },
  offlineDelete(id) { return this.del("/offline/delete/" + id); },

  share(novelId) { return this.get("/share/" + novelId); },
};
