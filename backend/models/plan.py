from datetime import datetime
from bson import ObjectId


class Plan:
    STATUS_DRAFT = 'draft'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_DELIVERED = 'delivered'
    STATUS_REVIEWED = 'reviewed'

    TYPE_CORPORATE = 'corporate'
    TYPE_TEAMBUILDING = 'teambuilding'
    TYPE_IMPROV_SHOW = 'improv_show'
    TYPE_IMPROV_TRAINING = 'improv_training'
    TYPE_TEAM_BUILDING = 'team_building'
    TYPE_WORKSHOP = 'workshop'
    TYPE_LECTURE = 'lecture'
    TYPE_CUSTOM = 'custom'

    # 兼容历史数据里的旧类型命名。
    # 其中 workshop/lecture 会暂时回落到 corporate，保证旧方案在新列表和统计里仍能正常展示。
    LEGACY_TYPE_MAP = {
        'corporate_training': TYPE_CORPORATE,
        'corporate': TYPE_CORPORATE,
        'team_building': TYPE_TEAMBUILDING,
        'teambuilding': TYPE_TEAMBUILDING,
        'improv_show': TYPE_IMPROV_SHOW,
        'improv_training': TYPE_IMPROV_TRAINING,
        'workshop': TYPE_CORPORATE,
        'lecture': TYPE_CORPORATE,
        'custom': TYPE_CUSTOM
    }

    TYPE_LABEL_MAP = {
        '企业培训': TYPE_CORPORATE,
        '团建活动': TYPE_TEAMBUILDING,
        '即兴演出': TYPE_IMPROV_SHOW,
        '即兴培训': TYPE_IMPROV_TRAINING,
        '即兴训练': TYPE_IMPROV_TRAINING,
        '团队建设': TYPE_TEAMBUILDING,
        '工作坊': TYPE_CORPORATE,
        '讲座/授课': TYPE_CORPORATE,
        '自定义': TYPE_CUSTOM
    }

    TYPE_LABELS = {
        TYPE_CORPORATE: '企业培训',
        TYPE_TEAMBUILDING: '团建活动',
        TYPE_IMPROV_SHOW: '即兴演出',
        TYPE_IMPROV_TRAINING: '即兴培训',
        TYPE_CUSTOM: '自定义'
    }

    # 已交付和已复盘的方案默认视为只读，避免现场结束后的方案被继续修改导致复盘上下文失真。
    READONLY_STATUSES = {STATUS_DELIVERED, STATUS_REVIEWED}

    @staticmethod
    def normalize_type(plan_type):
        return Plan.TYPE_LABEL_MAP.get(plan_type) or Plan.LEGACY_TYPE_MAP.get(plan_type, plan_type or Plan.TYPE_CUSTOM)

    @staticmethod
    def normalize_scenes(data):
        scenes = data.get('scenes')
        if isinstance(scenes, list):
            return [str(item) for item in scenes if item]
        scene = data.get('scene')
        if scene:
            return [str(scene)]
        tags = data.get('tags')
        if isinstance(tags, list):
            return [str(item) for item in tags if item]
        return []

    @staticmethod
    def normalize_review_notes(value):
        if isinstance(value, list):
            return [str(item) for item in value]
        if isinstance(value, str) and value:
            return [value]
        return []

    @staticmethod
    def normalize_prep_config(data):
        prep_config = data.get('prepConfig')
        if isinstance(prep_config, dict):
            return prep_config
        return {
            'headcount': data.get('people', 0),
            'checkinMode': data.get('checkinMode', 'qr'),
            'groupMode': data.get('groupMode', 'random'),
            'groupCount': data.get('groupCount', 0),
            'scoreMode': data.get('scoreMode', 'team')
        }

    @staticmethod
    def create(user_id, data):
        now = datetime.utcnow()
        return {
            '_id': ObjectId(),
            'userId': user_id,
            'name': data.get('name', ''),
            'type': Plan.normalize_type(data.get('type')),
            'status': data.get('status', Plan.STATUS_DRAFT),
            'people': int(data.get('people', 0) or 0),
            'client': data.get('client') or data.get('clientName', ''),
            'phases': data.get('phases', []),
            'date': data.get('date', ''),
            'duration': int(data.get('duration', 0) or 0),
            'scenes': Plan.normalize_scenes(data),
            'reviewMethod': str(data.get('reviewMethod', '') or '').lower(),
            'reviewNotes': Plan.normalize_review_notes(data.get('reviewNotes')),
            'prepConfig': Plan.normalize_prep_config(data),
            'source': data.get('source', 'manual'),
            'templateId': data.get('templateId', ''),
            'templateName': data.get('templateName', ''),
            'isTemplateInstance': bool(data.get('isTemplateInstance', False)),
            'isPersonalTemplate': bool(data.get('isPersonalTemplate', False)),
            'templateSourcePlanId': data.get('templateSourcePlanId', ''),
            'sessionId': data.get('sessionId', ''),
            'createdAt': now,
            'updatedAt': now
        }

    @staticmethod
    def to_dict(plan):
        if plan is None:
            return None
        result = dict(plan)
        result['id'] = str(result.pop('_id', ''))
        # to_dict 既做序列化，也顺便补齐 client/clientName、scene/scenes、tags 等兼容字段，
        # 这样前端列表和详情页可以在新旧数据混用时保持统一读取方式。
        result['type'] = Plan.normalize_type(result.get('type'))
        result['client'] = result.get('client') or result.get('clientName', '')
        result['clientName'] = result['client']
        result['scenes'] = Plan.normalize_scenes(result)
        result['tags'] = list(result['scenes'])
        result['reviewNotes'] = Plan.normalize_review_notes(result.get('reviewNotes'))
        result['reviewMethod'] = str(result.get('reviewMethod', '') or '').lower()
        result['prepConfig'] = Plan.normalize_prep_config(result)
        result['source'] = result.get('source', 'manual')
        result['templateId'] = result.get('templateId', '')
        result['templateName'] = result.get('templateName', '')
        result['isTemplateInstance'] = bool(result.get('isTemplateInstance', False))
        result['isPersonalTemplate'] = bool(result.get('isPersonalTemplate', False))
        result['templateSourcePlanId'] = result.get('templateSourcePlanId', '')
        result['typeLabel'] = Plan.TYPE_LABELS.get(result['type'], '自定义')
        if 'createdAt' in result:
            result['createdAt'] = result['createdAt'].isoformat() if isinstance(result['createdAt'], datetime) else result['createdAt']
        if 'updatedAt' in result:
            result['updatedAt'] = result['updatedAt'].isoformat() if isinstance(result['updatedAt'], datetime) else result['updatedAt']
        return result

    @staticmethod
    def can_edit(status):
        return status not in Plan.READONLY_STATUSES

    @staticmethod
    def can_confirm(status):
        return status == Plan.STATUS_DRAFT

    @staticmethod
    def can_deliver(status):
        # 只有已确认的方案允许开课；真正进入 delivered 要等 live/end 成功后再推进。
        return status == Plan.STATUS_CONFIRMED

    @staticmethod
    def can_review(status):
        return status == Plan.STATUS_DELIVERED

    @staticmethod
    def can_restart_review(status):
        # reviewed 允许重新发起复盘，便于补录或修正复盘结论。
        return status == Plan.STATUS_REVIEWED
