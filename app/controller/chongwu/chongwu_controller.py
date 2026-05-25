from typing import Optional, List
from fastapi import Request, Query, UploadFile, File, Form
from pydantic import BaseModel, Field


class PetCreateRequest(BaseModel):
    nickname: str = Field(..., description="宠物昵称")
    species: str = Field("other", description="物种")
    breed: Optional[str] = Field("", description="品种")
    birthday: Optional[str] = Field("", description="生日")
    estimated_age: Optional[str] = Field("", description="估计年龄")
    gender: Optional[str] = Field("unknown", description="性别")
    weight: Optional[float] = Field(0, description="体重")
    weight_unit: Optional[str] = Field("kg", description="体重单位")
    coat_color: Optional[str] = Field("", description="毛色")
    chip_number: Optional[str] = Field("", description="芯片号")
    personality_tags: Optional[List[str]] = Field([], description="性格标签")
    avatar: Optional[str] = Field("", description="头像")


class PetUpdateRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="宠物昵称")
    species: Optional[str] = Field(None, description="物种")
    breed: Optional[str] = Field(None, description="品种")
    birthday: Optional[str] = Field(None, description="生日")
    estimated_age: Optional[str] = Field(None, description="估计年龄")
    gender: Optional[str] = Field(None, description="性别")
    weight: Optional[float] = Field(None, description="体重")
    weight_unit: Optional[str] = Field(None, description="体重单位")
    coat_color: Optional[str] = Field(None, description="毛色")
    chip_number: Optional[str] = Field(None, description="芯片号")
    personality_tags: Optional[List[str]] = Field(None, description="性格标签")
    avatar: Optional[str] = Field(None, description="头像")


class HealthCreateRequest(BaseModel):
    vaccines: Optional[List[str]] = Field([], description="疫苗接种")
    deworming: Optional[List[str]] = Field([], description="驱虫记录")
    other_issues: Optional[str] = Field("", description="其他健康问题")


class HealthUpdateRequest(BaseModel):
    vaccines: Optional[List[str]] = Field(None, description="疫苗接种")
    deworming: Optional[List[str]] = Field(None, description="驱虫记录")
    other_issues: Optional[str] = Field(None, description="其他健康问题")


class DiaryCreateRequest(BaseModel):
    diary_date: str = Field(..., description="日记日期")
    content: str = Field("", description="日记内容")


class DiaryUpdateRequest(BaseModel):
    diary_date: Optional[str] = Field(None, description="日记日期")
    content: Optional[str] = Field(None, description="日记内容")


class ReminderCreateRequest(BaseModel):
    title: str = Field(..., description="提醒事项")
    reminder_time: str = Field(..., description="提醒时间")
    repeat_pattern: str = Field("daily", description="重复模式")
    notes: Optional[str] = Field("", description="备注")


class ReminderUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, description="提醒事项")
    reminder_time: Optional[str] = Field(None, description="提醒时间")
    repeat_pattern: Optional[str] = Field(None, description="重复模式")
    notes: Optional[str] = Field(None, description="备注")


class PhotoCreateRequest(BaseModel):
    photo_url: str = Field(..., description="照片URL")
    description: Optional[str] = Field("", description="描述")


class PhotoUpdateRequest(BaseModel):
    description: Optional[str] = Field(None, description="描述")


class MedicalCreateRequest(BaseModel):
    visit_date: str = Field(..., description="就医日期")
    hospital: Optional[str] = Field("", description="医院")
    diagnosis: Optional[str] = Field("", description="诊断")
    treatment: Optional[str] = Field("", description="治疗方案")
    prescription: Optional[str] = Field("", description="处方")
    notes: Optional[str] = Field("", description="备注")
    cost: Optional[float] = Field(0, description="费用")


class MedicalUpdateRequest(BaseModel):
    visit_date: Optional[str] = Field(None, description="就医日期")
    hospital: Optional[str] = Field(None, description="医院")
    diagnosis: Optional[str] = Field(None, description="诊断")
    treatment: Optional[str] = Field(None, description="治疗方案")
    prescription: Optional[str] = Field(None, description="处方")
    notes: Optional[str] = Field(None, description="备注")
    cost: Optional[float] = Field(None, description="费用")


class VaccineCreateRequest(BaseModel):
    vaccine_name: str = Field(..., description="疫苗名称")
    vaccine_date: str = Field(..., description="接种日期")
    next_date: Optional[str] = Field("", description="下次接种日期")
    hospital: Optional[str] = Field("", description="接种医院")
    notes: Optional[str] = Field("", description="备注")


class VaccineUpdateRequest(BaseModel):
    vaccine_name: Optional[str] = Field(None, description="疫苗名称")
    vaccine_date: Optional[str] = Field(None, description="接种日期")
    next_date: Optional[str] = Field(None, description="下次接种日期")
    hospital: Optional[str] = Field(None, description="接种医院")
    notes: Optional[str] = Field(None, description="备注")


class WeightCreateRequest(BaseModel):
    weight: float = Field(..., description="体重")
    weight_unit: str = Field("kg", description="体重单位")
    record_date: str = Field(..., description="记录日期")
    notes: Optional[str] = Field("", description="备注")


class WeightUpdateRequest(BaseModel):
    weight: Optional[float] = Field(None, description="体重")
    weight_unit: Optional[str] = Field(None, description="体重单位")
    record_date: Optional[str] = Field(None, description="记录日期")
    notes: Optional[str] = Field(None, description="备注")


class ChongwuController:
    def __init__(self):
        from app.business.chongwu.chongwu_business import ChongwuBusiness
        self.business = ChongwuBusiness()

    def ActionChongwuPetCreatePost(self, request: Request, body: PetCreateRequest):
        """
        创建宠物
        POST /api/chongwu/pet/create
        """
        return self.business.create_pet(body.model_dump())

    def ActionChongwuPetGet(self, request: Request, pet_id: int = Query(..., description="宠物ID")):
        """
        获取宠物详情
        GET /api/chongwu/pet/get
        """
        return self.business.get_pet(pet_id)

    def ActionChongwuPetUpdatePost(self, request: Request, pet_id: int = Query(..., description="宠物ID"),
                                    body: PetUpdateRequest = None):
        """
        更新宠物信息
        POST /api/chongwu/pet/update
        """
        update_data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.business.update_pet(pet_id, update_data)

    def ActionChongwuPetDeletePost(self, request: Request, pet_id: int = Query(..., description="宠物ID")):
        """
        删除宠物
        POST /api/chongwu/pet/delete
        """
        return self.business.delete_pet(pet_id)

    def ActionChongwuPetListGet(self, request: Request,
                                 page: int = Query(1, ge=1, description="页码"),
                                 page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                 species: Optional[str] = Query(None, description="物种筛选"),
                                 keyword: Optional[str] = Query(None, description="搜索关键词")):
        """
        获取宠物列表
        GET /api/chongwu/pet/list/get
        """
        return self.business.get_pet_list(page=page, page_size=page_size,
                                          species=species, keyword=keyword)

    def ActionChongwuPetProfileGet(self, request: Request, pet_id: int = Query(..., description="宠物ID")):
        """
        获取宠物完整档案
        GET /api/chongwu/pet/profile/get
        """
        return self.business.get_pet_full_profile(pet_id)

    def ActionChongwuHealthCreatePost(self, request: Request, pet_id: int = Query(..., description="宠物ID"),
                                       body: HealthCreateRequest = None):
        """
        创建健康档案
        POST /api/chongwu/health/create
        """
        return self.business.create_health(pet_id, body.model_dump())

    def ActionChongwuHealthGet(self, request: Request, record_id: int = Query(..., description="记录ID")):
        """
        获取健康档案详情
        GET /api/chongwu/health/get
        """
        return self.business.get_health(record_id)

    def ActionChongwuHealthListGet(self, request: Request,
                                    pet_id: int = Query(..., description="宠物ID"),
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(20, ge=1, le=100, description="每页数量")):
        """
        获取宠物健康档案列表
        GET /api/chongwu/health/list/get
        """
        return self.business.get_health_by_pet(pet_id, page=page, page_size=page_size)

    def ActionChongwuHealthUpdatePost(self, request: Request, record_id: int = Query(..., description="记录ID"),
                                       body: HealthUpdateRequest = None):
        """
        更新健康档案
        POST /api/chongwu/health/update
        """
        update_data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.business.update_health(record_id, update_data)

    def ActionChongwuHealthDeletePost(self, request: Request, record_id: int = Query(..., description="记录ID")):
        """
        删除健康档案
        POST /api/chongwu/health/delete
        """
        return self.business.delete_health(record_id)

    def ActionChongwuDiaryCreatePost(self, request: Request, pet_id: int = Query(..., description="宠物ID"),
                                      body: DiaryCreateRequest = None):
        """
        创建成长日记
        POST /api/chongwu/diary/create
        """
        return self.business.create_diary(pet_id, body.model_dump())

    def ActionChongwuDiaryGet(self, request: Request, record_id: int = Query(..., description="日记ID")):
        """
        获取成长日记详情
        GET /api/chongwu/diary/get
        """
        return self.business.get_diary(record_id)

    def ActionChongwuDiaryListGet(self, request: Request,
                                   pet_id: int = Query(..., description="宠物ID"),
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(20, ge=1, le=100, description="每页数量")):
        """
        获取宠物成长日记列表
        GET /api/chongwu/diary/list/get
        """
        return self.business.get_diary_by_pet(pet_id, page=page, page_size=page_size)

    def ActionChongwuDiaryUpdatePost(self, request: Request, record_id: int = Query(..., description="日记ID"),
                                      body: DiaryUpdateRequest = None):
        """
        更新成长日记
        POST /api/chongwu/diary/update
        """
        update_data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.business.update_diary(record_id, update_data)

    def ActionChongwuDiaryDeletePost(self, request: Request, record_id: int = Query(..., description="日记ID")):
        """
        删除成长日记
        POST /api/chongwu/diary/delete
        """
        return self.business.delete_diary(record_id)

    def ActionChongwuReminderCreatePost(self, request: Request, pet_id: int = Query(..., description="宠物ID"),
                                         body: ReminderCreateRequest = None):
        """
        创建提醒事项
        POST /api/chongwu/reminder/create
        """
        return self.business.create_reminder(pet_id, body.model_dump())

    def ActionChongwuReminderGet(self, request: Request, record_id: int = Query(..., description="提醒ID")):
        """
        获取提醒详情
        GET /api/chongwu/reminder/get
        """
        return self.business.get_reminder(record_id)

    def ActionChongwuReminderListGet(self, request: Request,
                                      pet_id: Optional[int] = Query(None, description="宠物ID"),
                                      page: int = Query(1, ge=1, description="页码"),
                                      page_size: int = Query(20, ge=1, le=100, description="每页数量")):
        """
        获取提醒列表
        GET /api/chongwu/reminder/list/get
        """
        if pet_id:
            return self.business.get_reminder_by_pet(pet_id, page=page, page_size=page_size)
        return self.business.get_reminder_all(page=page, page_size=page_size)

    def ActionChongwuReminderUpdatePost(self, request: Request, record_id: int = Query(..., description="提醒ID"),
                                         body: ReminderUpdateRequest = None):
        """
        更新提醒事项
        POST /api/chongwu/reminder/update
        """
        update_data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.business.update_reminder(record_id, update_data)

    def ActionChongwuReminderDeletePost(self, request: Request, record_id: int = Query(..., description="提醒ID")):
        """
        删除提醒事项
        POST /api/chongwu/reminder/delete
        """
        return self.business.delete_reminder(record_id)

    def ActionChongwuPhotoCreatePost(self, request: Request, pet_id: int = Query(..., description="宠物ID"),
                                      body: PhotoCreateRequest = None):
        """
        创建宠物照片
        POST /api/chongwu/photo/create
        """
        return self.business.create_photo(pet_id, body.model_dump())

    def ActionChongwuPhotoGet(self, request: Request, record_id: int = Query(..., description="照片ID")):
        """
        获取照片详情
        GET /api/chongwu/photo/get
        """
        return self.business.get_photo(record_id)

    def ActionChongwuPhotoListGet(self, request: Request,
                                   pet_id: Optional[int] = Query(None, description="宠物ID"),
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(20, ge=1, le=100, description="每页数量")):
        """
        获取宠物照片列表
        GET /api/chongwu/photo/list/get
        """
        if pet_id:
            return self.business.get_photo_by_pet(pet_id, page=page, page_size=page_size)
        return self.business.get_photo_all(page=page, page_size=page_size)

    def ActionChongwuPhotoUpdatePost(self, request: Request, record_id: int = Query(..., description="照片ID"),
                                      body: PhotoUpdateRequest = None):
        """
        更新照片描述
        POST /api/chongwu/photo/update
        """
        update_data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.business.update_photo(record_id, update_data)

    def ActionChongwuPhotoDeletePost(self, request: Request, record_id: int = Query(..., description="照片ID")):
        """
        删除照片
        POST /api/chongwu/photo/delete
        """
        return self.business.delete_photo(record_id)

    def ActionChongwuMedicalCreatePost(self, request: Request, pet_id: int = Query(..., description="宠物ID"),
                                        body: MedicalCreateRequest = None):
        """
        创建就医记录
        POST /api/chongwu/medical/create
        """
        return self.business.create_medical(pet_id, body.model_dump())

    def ActionChongwuMedicalGet(self, request: Request, record_id: int = Query(..., description="记录ID")):
        """
        获取就医记录详情
        GET /api/chongwu/medical/get
        """
        return self.business.get_medical(record_id)

    def ActionChongwuMedicalListGet(self, request: Request,
                                     pet_id: int = Query(..., description="宠物ID"),
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(20, ge=1, le=100, description="每页数量")):
        """
        获取就医记录列表
        GET /api/chongwu/medical/list/get
        """
        return self.business.get_medical_by_pet(pet_id, page=page, page_size=page_size)

    def ActionChongwuMedicalUpdatePost(self, request: Request, record_id: int = Query(..., description="记录ID"),
                                        body: MedicalUpdateRequest = None):
        """
        更新就医记录
        POST /api/chongwu/medical/update
        """
        update_data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.business.update_medical(record_id, update_data)

    def ActionChongwuMedicalDeletePost(self, request: Request, record_id: int = Query(..., description="记录ID")):
        """
        删除就医记录
        POST /api/chongwu/medical/delete
        """
        return self.business.delete_medical(record_id)

    def ActionChongwuVaccineCreatePost(self, request: Request, pet_id: int = Query(..., description="宠物ID"),
                                        body: VaccineCreateRequest = None):
        """
        创建疫苗记录
        POST /api/chongwu/vaccine/create
        """
        return self.business.create_vaccine(pet_id, body.model_dump())

    def ActionChongwuVaccineGet(self, request: Request, record_id: int = Query(..., description="记录ID")):
        """
        获取疫苗记录详情
        GET /api/chongwu/vaccine/get
        """
        return self.business.get_vaccine(record_id)

    def ActionChongwuVaccineListGet(self, request: Request,
                                     pet_id: int = Query(..., description="宠物ID"),
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(20, ge=1, le=100, description="每页数量")):
        """
        获取疫苗记录列表
        GET /api/chongwu/vaccine/list/get
        """
        return self.business.get_vaccine_by_pet(pet_id, page=page, page_size=page_size)

    def ActionChongwuVaccineUpdatePost(self, request: Request, record_id: int = Query(..., description="记录ID"),
                                        body: VaccineUpdateRequest = None):
        """
        更新疫苗记录
        POST /api/chongwu/vaccine/update
        """
        update_data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.business.update_vaccine(record_id, update_data)

    def ActionChongwuVaccineDeletePost(self, request: Request, record_id: int = Query(..., description="记录ID")):
        """
        删除疫苗记录
        POST /api/chongwu/vaccine/delete
        """
        return self.business.delete_vaccine(record_id)

    def ActionChongwuWeightCreatePost(self, request: Request, pet_id: int = Query(..., description="宠物ID"),
                                       body: WeightCreateRequest = None):
        """
        创建体重记录
        POST /api/chongwu/weight/create
        """
        return self.business.create_weight(pet_id, body.model_dump())

    def ActionChongwuWeightGet(self, request: Request, record_id: int = Query(..., description="记录ID")):
        """
        获取体重记录详情
        GET /api/chongwu/weight/get
        """
        return self.business.get_weight(record_id)

    def ActionChongwuWeightListGet(self, request: Request,
                                    pet_id: int = Query(..., description="宠物ID"),
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(50, ge=1, le=200, description="每页数量")):
        """
        获取体重记录列表
        GET /api/chongwu/weight/list/get
        """
        return self.business.get_weight_by_pet(pet_id, page=page, page_size=page_size)

    def ActionChongwuWeightChartGet(self, request: Request, pet_id: int = Query(..., description="宠物ID")):
        """
        获取体重折线图数据
        GET /api/chongwu/weight/chart/get
        """
        return self.business.get_weight_chart(pet_id)

    def ActionChongwuWeightUpdatePost(self, request: Request, record_id: int = Query(..., description="记录ID"),
                                       body: WeightUpdateRequest = None):
        """
        更新体重记录
        POST /api/chongwu/weight/update
        """
        update_data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.business.update_weight(record_id, update_data)

    def ActionChongwuWeightDeletePost(self, request: Request, record_id: int = Query(..., description="记录ID")):
        """
        删除体重记录
        POST /api/chongwu/weight/delete
        """
        return self.business.delete_weight(record_id)