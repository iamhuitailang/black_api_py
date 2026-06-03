import random
import json
from typing import List, Optional
from sqlalchemy.orm import Session
from model.kl_model.models import GeneModification, Dinosaur, DinosaurGeneModification
from model.kl_model.schemas.gene_modification import GeneModificationCreate


class GeneBusiness:
    @staticmethod
    def get_gene_modification(db: Session, gene_id: int) -> Optional[GeneModification]:
        return db.query(GeneModification).filter(GeneModification.id == gene_id).first()

    @staticmethod
    def get_all_gene_modifications(db: Session, user_level: int = 1) -> List[GeneModification]:
        return db.query(GeneModification).all()

    @staticmethod
    def create_gene_modification(db: Session, gene: GeneModificationCreate) -> GeneModification:
        db_gene = GeneModification(**gene.model_dump())
        db.add(db_gene)
        db.commit()
        db.refresh(db_gene)
        return db_gene

    @staticmethod
    def apply_gene_modification(
        db: Session, 
        dinosaur_id: int, 
        gene_id: int, 
        user_id: int
    ) -> tuple[Optional[Dinosaur], str, float, float]:
        dinosaur = db.query(Dinosaur).filter(
            Dinosaur.id == dinosaur_id,
            Dinosaur.user_id == user_id
        ).first()
        
        if not dinosaur:
            return None, "恐龙不存在", 0, 0
        
        gene = GeneBusiness.get_gene_modification(db, gene_id)
        if not gene:
            return None, "基因改造不存在", 0, 0
        
        existing_mod = db.query(DinosaurGeneModification).filter(
            DinosaurGeneModification.dinosaur_id == dinosaur_id,
            DinosaurGeneModification.gene_modification_id == gene_id
        ).first()
        
        if existing_mod and existing_mod.is_active:
            return None, "该基因改造已应用", 0, 0
        
        success = random.random() < gene.success_rate
        
        if not success:
            return None, "基因改造失败！", gene.cost_coins, gene.cost_diamonds
        
        dinosaur.is_genetically_modified = True
        
        current_mods = json.loads(dinosaur.gene_modifications) if dinosaur.gene_modifications else {}
        current_mods[gene.code] = True
        dinosaur.gene_modifications = json.dumps(current_mods)
        
        dinosaur.aggression = max(0, min(100, dinosaur.aggression + gene.effect_aggression))
        dinosaur.intelligence = max(0, min(100, dinosaur.intelligence + gene.effect_intelligence))
        dinosaur.speed = max(0, min(100, dinosaur.speed + gene.effect_speed))
        dinosaur.health = max(0, min(100, dinosaur.health + gene.effect_health))
        
        db_gene_mod = DinosaurGeneModification(
            dinosaur_id=dinosaur_id,
            gene_modification_id=gene_id
        )
        db.add(db_gene_mod)
        db.commit()
        db.refresh(dinosaur)
        
        return dinosaur, f"成功应用基因改造: {gene.name}！", gene.cost_coins, gene.cost_diamonds

    @staticmethod
    def get_dinosaur_gene_modifications(db: Session, dinosaur_id: int, user_id: int) -> List[GeneModification]:
        dinosaur = db.query(Dinosaur).filter(
            Dinosaur.id == dinosaur_id,
            Dinosaur.user_id == user_id
        ).first()
        
        if not dinosaur:
            return []
        
        mods = db.query(DinosaurGeneModification).filter(
            DinosaurGeneModification.dinosaur_id == dinosaur_id,
            DinosaurGeneModification.is_active == True
        ).all()
        
        gene_ids = [mod.gene_modification_id for mod in mods]
        return db.query(GeneModification).filter(GeneModification.id.in_(gene_ids)).all()
