import urllib.request
import json

BASE = "http://localhost:8001/api"

def req(method, path, body=None, token=None):
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body:
        data = json.dumps(body).encode()
    r = urllib.request.Request(f"{BASE}{path}", data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(r) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return {"code": e.code, "message": e.read().decode()}

print("=== 1. 登录测试 (author1/author123) ===")
res = req("POST", "/auth/login", {"username": "author1", "password": "author123"})
print(f"  code={res.get('code')} message={res.get('message')}")
token_a = res.get("data", {}).get("token") if res.get("code") == 0 else None
user_a = res.get("data", {}).get("user") if res.get("code") == 0 else None
print(f"  token={'OK' if token_a else 'NONE'} user={user_a}")

print("\n=== 2. 获取用户角色信息 ===")
if token_a:
    res = req("GET", "/journal/role/get", token=token_a)
    print(f"  code={res.get('code')} role={res.get('data',{}).get('role')} role_label={res.get('data',{}).get('role_label')}")

print("\n=== 3. 获取栏目列表 ===")
if token_a:
    res = req("GET", "/journal/section/list/get", token=token_a)
    print(f"  code={res.get('code')} count={len(res.get('data',[]))}")
    for s in (res.get("data") or []):
        print(f"    - id={s['id']} name={s['name']}")

print("\n=== 4. 编辑登录测试 (editor/editor123) ===")
res = req("POST", "/auth/login", {"username": "editor", "password": "editor123"})
print(f"  code={res.get('code')} message={res.get('message')}")
token_e = res.get("data", {}).get("token") if res.get("code") == 0 else None
if token_e:
    res = req("GET", "/journal/role/get", token=token_e)
    print(f"  role={res.get('data',{}).get('role')} is_editor={res.get('data',{}).get('is_editor')}")

print("\n=== 5. 获取审稿人列表 (编辑权限) ===")
if token_e:
    res = req("GET", "/journal/reviewer/list/get", token=token_e)
    print(f"  code={res.get('code')} count={len(res.get('data',[]))}")
    for r in (res.get("data") or []):
        print(f"    - user_id={r['user_id']} name={r.get('real_name')} role={r.get('role')}")

print("\n=== 6. 作者创建稿件测试 ===")
if token_a:
    body = {
        "title": "基于深度学习的图像识别研究",
        "abstract": "本文提出了一种新的深度学习方法用于图像识别任务...",
        "file_path": "/static/journal/uploads/test.pdf",
        "file_name": "test.pdf",
        "keywords": "深度学习,图像识别,卷积神经网络",
        "section_id": 1,
        "author_name": "陈博士",
        "author_email": "chen@test.com",
        "author_affiliation": "北京大学"
    }
    res = req("POST", "/journal/manuscript/set", body, token=token_a)
    print(f"  code={res.get('code')} message={res.get('message')}")
    manuscript_id = res.get("data", {}).get("id") if res.get("code") == 0 else None
    print(f"  新稿件ID: {manuscript_id}")

    print("\n=== 7. 作者提交稿件 ===")
    if manuscript_id:
        res = req("POST", "/journal/manuscript/submit", {"manuscript_id": manuscript_id}, token=token_a)
        print(f"  code={res.get('code')} message={res.get('message')}")

        print("\n=== 8. 获取作者投稿列表 ===")
        res = req("GET", "/journal/manuscript/list/get", token=token_a)
        print(f"  code={res.get('code')} count={res.get('data',{}).get('total')}")
        for m in (res.get("data", {}).get("items") or []):
            print(f"    - #{m['id']} {m['title']} [{m.get('status_label')}]")

        print("\n=== 9. 编辑获取全部稿件 ===")
        if token_e:
            res = req("GET", "/journal/editor/all/list/get", token=token_e)
            print(f"  code={res.get('code')} count={res.get('data',{}).get('total')}")

            print("\n=== 10. 编辑分配审稿人 ===")
            body = {"manuscript_id": manuscript_id, "reviewer_user_id": 3}
            res = req("POST", "/journal/review/assign", body, token=token_e)
            print(f"  分配给审稿人#3: code={res.get('code')} message={res.get('message')}")
            body2 = {"manuscript_id": manuscript_id, "reviewer_user_id": 4}
            res2 = req("POST", "/journal/review/assign", body2, token=token_e)
            print(f"  分配给审稿人#4: code={res2.get('code')} message={res2.get('message')}")

print("\n=== 11. 审稿人登录和任务列表 (reviewer1) ===")
res = req("POST", "/auth/login", {"username": "reviewer1", "password": "reviewer123"})
token_r1 = res.get("data", {}).get("token") if res.get("code") == 0 else None
if token_r1:
    res = req("GET", "/journal/review/task/stats/get", token=token_r1)
    print(f"  任务统计: code={res.get('code')} data={res.get('data')}")
    res = req("GET", "/journal/review/task/list/get", token=token_r1)
    print(f"  任务列表: code={res.get('code')} count={res.get('data',{}).get('total')}")
    tasks = res.get("data", {}).get("items") or []
    if tasks:
        t = tasks[0]
        aid = t.get("assignment", {}).get("id")
        print(f"  任务#1: assignment_id={aid} status={t.get('assignment',{}).get('status')}")

        print("\n=== 12. 审稿人接受任务并提交意见 ===")
        res = req("POST", "/journal/review/assignment/accept", {"assignment_id": aid}, token=token_r1)
        print(f"  接受任务: code={res.get('code')} message={res.get('message')}")

        review_body = {
            "assignment_id": aid,
            "recommendation": "minor_revision",
            "originality_score": 8,
            "scientific_score": 7,
            "language_score": 8,
            "overall_score": 8,
            "comment_to_author": "论文研究内容具有创新性，实验设计合理。建议：1)补充更多对比实验；2)完善相关工作部分的文献综述。",
            "comment_to_editor": "该论文质量较好，修改后可录用。"
        }
        res = req("POST", "/journal/review/submit", review_body, token=token_r1)
        print(f"  提交审稿意见: code={res.get('code')} message={res.get('message')}")

print("\n=== 13. reviewer2 也提交意见 ===")
res = req("POST", "/auth/login", {"username": "reviewer2", "password": "reviewer123"})
token_r2 = res.get("data", {}).get("token") if res.get("code") == 0 else None
if token_r2 and manuscript_id:
    res = req("GET", "/journal/review/task/list/get", token=token_r2)
    tasks = res.get("data", {}).get("items") or []
    if tasks:
        aid = tasks[0].get("assignment", {}).get("id")
        req("POST", "/journal/review/assignment/accept", {"assignment_id": aid}, token=token_r2)
        review_body = {
            "assignment_id": aid,
            "recommendation": "accept",
            "originality_score": 9,
            "scientific_score": 8,
            "language_score": 9,
            "overall_score": 9,
            "comment_to_author": "论文质量很高，创新性强，实验充分，可直接录用发表。",
            "comment_to_editor": "推荐直接录用"
        }
        res = req("POST", "/journal/review/submit", review_body, token=token_r2)
        print(f"  reviewer2提交意见: code={res.get('code')} message={res.get('message')}")

print("\n=== 14. 编辑查看审稿完成稿件并做决定 ===")
if token_e and manuscript_id:
    res = req("GET", f"/journal/manuscript/detail/get?manuscript_id={manuscript_id}", token=token_e)
    print(f"  稿件详情: code={res.get('code')} status={res.get('data',{}).get('status')}")
    reviews = res.get("data", {}).get("reviews") or []
    print(f"  审稿意见数量: {len(reviews)}")
    for r in reviews:
        print(f"    - 审稿人:{r.get('reviewer_name')} 建议:{r.get('recommendation_label')} 评分:{r.get('overall_score')}")

    print("\n=== 15. 编辑最终决定: 录用 ===")
    body = {
        "manuscript_id": manuscript_id,
        "decision": "accepted",
        "comment": "经两位审稿人评审，稿件质量优秀，同意录用。恭喜！"
    }
    res = req("POST", "/journal/editor/decision", body, token=token_e)
    print(f"  决定: code={res.get('code')} message={res.get('message')}")

print("\n=== 16. 作者查看最终结果 ===")
if token_a and manuscript_id:
    res = req("GET", f"/journal/manuscript/detail/get?manuscript_id={manuscript_id}", token=token_a)
    m = res.get("data", {})
    print(f"  状态: {m.get('status_label')}")
    print(f"  当前步骤: {m.get('current_step')}/{m.get('total_steps')}")
    print(f"  编辑决定: {m.get('editor_decision_label')}")
    print(f"  编辑意见: {m.get('editor_comment')}")
    reviews = m.get("reviews") or []
    print(f"  作者可见审稿意见: {len(reviews)}份")
    for r in reviews:
        print(f"    - 建议:{r.get('recommendation_label')} 意见: {r.get('comment_to_author')[:50]}...")

print("\n=== ✓ 全流程测试完成 ===")
