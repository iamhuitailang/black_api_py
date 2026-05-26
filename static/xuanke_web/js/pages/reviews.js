const ReviewsPage = {
    template: `
        <div class="page-container">
            <div class="page-card">
                <div class="page-title">我的评价</div>
                
                <div v-for="review in myReviews" :key="review.id" class="review-card">
                    <div class="review-header">
                        <div class="review-user">
                            <el-avatar :size="48">{{ review.course_name?.charAt(0) }}</el-avatar>
                            <div>
                                <div style="font-weight: 600; font-size: 16px;">{{ review.course_name }}</div>
                                <div style="color: #909399; font-size: 12px;">{{ review.teacher }}</div>
                            </div>
                        </div>
                        <div>
                            <el-tag 
                                :type="review.status === 'approved' ? 'success' : (review.status === 'pending' ? 'warning' : 'danger')"
                                size="small"
                            >
                                {{ review.status === 'approved' ? '已通过' : (review.status === 'pending' ? '审核中' : '已驳回') }}
                            </el-tag>
                        </div>
                    </div>
                    
                    <div style="margin: 12px 0;">
                        <el-rate v-model="review.rating" disabled show-score />
                    </div>
                    
                    <div class="review-content">{{ review.comment }}</div>
                    
                    <div class="review-footer">
                        <span>{{ review.anonymous ? '匿名评价' : '实名评价' }}</span>
                        <span>{{ formatDate(review.created_at) }}</span>
                        <div>
                            <el-button type="primary" link size="small" @click="editReview(review)">
                                编辑
                            </el-button>
                            <el-button type="danger" link size="small" @click="deleteReview(review)">
                                删除
                            </el-button>
                        </div>
                    </div>
                </div>
                
                <el-empty v-if="myReviews.length === 0" description="暂无评价，去评价已修课程吧！" />
            </div>
            
            <div class="page-card" style="margin-top: 24px;">
                <div class="page-title">待评价课程</div>
                
                <el-table :data="coursesToReview" border stripe>
                    <el-table-column prop="course_code" label="课程代码" width="120" />
                    <el-table-column prop="course_name" label="课程名称" min-width="180" />
                    <el-table-column prop="course_type_text" label="类型" width="80" />
                    <el-table-column prop="teacher" label="授课教师" width="120" />
                    <el-table-column prop="credits" label="学分" width="80" />
                    <el-table-column prop="score" label="成绩" width="100">
                        <template #default="{ row }">
                            <span v-if="row.score !== null" style="font-weight: 600;">{{ row.score }}分</span>
                            <span v-else style="color: #909399;">-</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="120">
                        <template #default="{ row }">
                            <el-button type="primary" link size="small" @click="addReview(row)">
                                去评价
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
                
                <el-empty v-if="coursesToReview.length === 0" description="所有已修课程都已评价" />
            </div>
            
            <el-dialog v-model="reviewDialogVisible" :title="isEdit ? '编辑评价' : '课程评价'" width="500px">
                <el-form ref="reviewForm" :model="reviewForm" :rules="rules" label-position="top">
                    <el-form-item label="课程" v-if="selectedCourse">
                        <div style="font-weight: 600;">{{ selectedCourse.course_name }}</div>
                        <div style="color: #909399; font-size: 12px;">{{ selectedCourse.teacher }}</div>
                    </el-form-item>
                    
                    <el-form-item label="评分" prop="rating">
                        <el-rate v-model="reviewForm.rating" show-score />
                    </el-form-item>
                    
                    <el-form-item label="评价内容" prop="comment">
                        <el-input 
                            v-model="reviewForm.comment" 
                            type="textarea" 
                            :rows="4" 
                            placeholder="请输入您对课程的评价..."
                            maxlength="500"
                            show-word-limit
                        />
                    </el-form-item>
                    
                    <el-form-item>
                        <el-checkbox v-model="reviewForm.anonymous">匿名评价</el-checkbox>
                    </el-form-item>
                </el-form>
                
                <template #footer>
                    <el-button @click="reviewDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitReview" :loading="submitting">
                        {{ isEdit ? '更新' : '提交' }}
                    </el-button>
                </template>
            </el-dialog>
        </div>
    `,
    setup() {
        const { ref, reactive, onMounted } = Vue;

        const myReviews = ref([]);
        const coursesToReview = ref([]);
        const reviewDialogVisible = ref(false);
        const selectedCourse = ref(null);
        const isEdit = ref(false);
        const submitting = ref(false);
        const reviewForm = ref(null);
        
        const reviewFormData = reactive({
            id: null,
            rating: 5,
            comment: '',
            anonymous: false
        });

        const rules = {
            rating: [
                { required: true, message: '请选择评分', trigger: 'change' }
            ],
            comment: [
                { required: true, message: '请输入评价内容', trigger: 'blur' },
                { min: 10, message: '评价内容至少10个字', trigger: 'blur' }
            ]
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            return dateStr.replace('T', ' ').substring(0, 16);
        };

        const loadMyReviews = async () => {
            const response = await API.review.getMyReviews();
            if (response.code === 0) {
                myReviews.value = response.data || [];
            }
        };

        const loadCoursesToReview = async () => {
            const enrollResponse = await API.enrollment.getMyCourses();
            if (enrollResponse.code === 0) {
                const allCourses = enrollResponse.data.courses || [];
                const reviewedCourseIds = myReviews.value.map(r => r.course_id);
                coursesToReview.value = allCourses.filter(
                    c => c.score !== null && c.score >= 60 && !reviewedCourseIds.includes(c.id)
                );
            }
        };

        const addReview = (course) => {
            selectedCourse.value = course;
            isEdit.value = false;
            reviewFormData.id = null;
            reviewFormData.rating = 5;
            reviewFormData.comment = '';
            reviewFormData.anonymous = false;
            reviewDialogVisible.value = true;
        };

        const editReview = (review) => {
            selectedCourse.value = {
                course_name: review.course_name,
                teacher: review.teacher
            };
            isEdit.value = true;
            reviewFormData.id = review.id;
            reviewFormData.rating = review.rating;
            reviewFormData.comment = review.comment;
            reviewFormData.anonymous = review.anonymous;
            reviewDialogVisible.value = true;
        };

        const deleteReview = async (review) => {
            try {
                await Toast.confirm(`确定要删除对"${review.course_name}"的评价吗？`);
            } catch (e) {
                return;
            }
            
            const response = await API.review.delete(review.id);
            if (response.code === 0) {
                Toast.success('删除成功');
                loadMyReviews();
                loadCoursesToReview();
            } else {
                Toast.error(response.msg);
            }
        };

        const submitReview = async () => {
            if (!reviewForm.value) return;
            
            try {
                await reviewForm.value.validate();
            } catch (e) {
                return;
            }
            
            submitting.value = true;
            try {
                const data = {
                    course_id: selectedCourse.value?.id || selectedCourse.value?.course_id,
                    rating: reviewFormData.rating,
                    comment: reviewFormData.comment,
                    anonymous: reviewFormData.anonymous
                };
                
                let response;
                if (isEdit.value) {
                    data.id = reviewFormData.id;
                    response = await API.review.update(data);
                } else {
                    response = await API.review.create(data);
                }
                
                if (response.code === 0) {
                    Toast.success(isEdit.value ? '更新成功' : '评价成功');
                    reviewDialogVisible.value = false;
                    loadMyReviews();
                    loadCoursesToReview();
                } else {
                    Toast.error(response.msg);
                }
            } finally {
                submitting.value = false;
            }
        };

        onMounted(() => {
            if (!Auth.requireAuth()) return;
            loadMyReviews().then(loadCoursesToReview);
        });

        return {
            myReviews,
            coursesToReview,
            reviewDialogVisible,
            selectedCourse,
            isEdit,
            submitting,
            reviewForm,
            reviewForm: reviewFormData,
            rules,
            formatDate,
            addReview,
            editReview,
            deleteReview,
            submitReview
        };
    }
};
