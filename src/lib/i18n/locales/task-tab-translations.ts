import type { DeepPartial } from '@/lib/i18n/merge-locale';

type TaskCopy = { title: string; description: string };

const sharedSlugEn: Record<string, TaskCopy> = {
  'blink-drill': {
    title: 'Blink drill',
    description: 'Blink fully 10 times, pause, then repeat twice to refresh your tear film.',
  },
  'coffee-gaze-break': {
    title: 'Coffee gaze break',
    description: 'Look out a window at a distant object while your drink cools — no phone scrolling.',
  },
  'near-far-focus': {
    title: 'Near–far focus shift',
    description: 'Alternate focus between your fingertip and a far object for 60 seconds.',
  },
  palming: {
    title: 'Palming rest',
    description: 'Cover closed eyes with warm palms for one minute without pressing on the lids.',
  },
  '20-20-20': {
    title: '20-20-20 break',
    description: 'Every 20 minutes, look 20 feet away for 20 seconds before returning to your screen.',
  },
  'figure-eight': {
    title: 'Figure-eight tracking',
    description: 'Slowly trace a large figure eight with your eyes for 30 seconds in each direction.',
  },
};

const sharedCategoryEn: Record<string, string> = {
  'blink-drill': 'BLINK DRILL',
  'coffee-gaze-break': 'GAZE BREAK',
  'near-far-focus': 'FOCUS SHIFT',
  palming: 'PALMING',
  '20-20-20': 'SCREEN BREAK',
  'figure-eight': 'EYE EXERCISE',
};

const sharedThemeCopyEn = {
  'eye-exercise': {
    title: 'Eye movement drill',
    description: 'Follow a slow figure-eight or near–far focus shift for one minute to relax eye muscles.',
  },
  'screen-break': {
    title: '20-20-20 screen break',
    description: 'Every 20 minutes, look at something 20 feet away for 20 seconds before returning to your screen.',
  },
  'vision-rest': {
    title: 'Palming rest',
    description: 'Cup your palms over closed eyes without pressing, breathe slowly, and rest for 60 seconds.',
  },
  hydration: {
    title: 'Hydration check',
    description: 'Drink a full glass of water and blink fully a few times to keep the tear film stable.',
  },
  posture: {
    title: 'Screen distance reset',
    description: 'Sit back, align the top of the screen near eye level, and keep an arm-length viewing distance.',
  },
  nutrition: {
    title: 'Eye-friendly snack',
    description: 'Choose leafy greens, citrus, or nuts today to support long-term eye health.',
  },
  sleep: {
    title: 'Wind-down for eyes',
    description: 'Dim screens 30 minutes before bed and avoid scrolling in a dark room.',
  },
  environment: {
    title: 'Lighting check',
    description: 'Reduce glare, match room lighting to screen brightness, and avoid harsh overhead lights.',
  },
} as const;

const taskTabUiKo = {
  overallCompleted: '{{completed}}/{{total}} 완료',
  periodCompleted: '{{completed}}/{{total}} 완료',
  loading: '오늘 일정 불러오는 중…',
  translating: '선택한 언어로 일정을 준비하는 중…',
  emptyTitle: '이 날짜에 이용 가능한 일정이 없습니다.',
  emptyHint: '일정은 매일 자동으로 생성됩니다. 캘린더에서 다른 날짜를 선택해 보세요.',
  noLocaleContentTitle: '이 언어로 된 일정 내용이 없습니다',
  noLocaleContentHint:
    '선택한 날짜의 일정이 현재 앱 언어로 제공되지 않습니다. 설정에서 언어를 변경하거나 다른 날짜를 선택하세요.',
  allCompleteTitle: '오늘 일정을 모두 완료했어요!',
  allCompleteBody: '오늘의 모든 눈 건강 루틴을 마쳤습니다. 정말 잘하셨어요.',
  errorTitle: '일정을 불러오지 못했습니다',
  toggleA11y: '일정 토글: {{title}}',
  period: {
    morning: '아침',
    afternoon: '오후',
    evening: '저녁',
    night: '밤',
  },
  periodHint: {
    morning: '하루를 시작하세요',
    afternoon: '낮 시간 습관',
    evening: '하루를 마무리하세요',
    night: '취침 전',
  },
  category: {
    'eye-exercise': '눈 운동',
    'screen-break': '화면 휴식',
    'vision-rest': '눈 휴식',
    hydration: '수분',
    posture: '자세',
    nutrition: '영양',
    sleep: '수면',
    environment: '환경',
    'blink-drill': '깜빡임 드릴',
    'coffee-gaze-break': '시선 휴식',
    'near-far-focus': '근·원 초점',
    palming: '손바닥 휴식',
    '20-20-20': '20-20-20',
    'figure-eight': '8자 추적',
  },
  slug: {
    'blink-drill': {
      title: '깜빡임 드릴',
      description: '눈을 완전히 10번 깜빡인 뒤 잠시 쉬고, 두 번 더 반복해 눈물막을 새로고침하세요.',
    },
    'coffee-gaze-break': {
      title: '커피 시선 휴식',
      description: '음료가 식는 동안 창밖의 먼 사물을 바라보세요 — 휴대폰 스크롤은 피하세요.',
    },
    'near-far-focus': {
      title: '근·원 초점 전환',
      description: '손가락과 먼 사물 사이를 60초 동안 번갈아 초점을 맞추세요.',
    },
    palming: {
      title: '손바닥 휴식',
      description: '눈을 감고 따뜻한 손바닥으로 1분간 가볍게 덮으세요.',
    },
    '20-20-20': {
      title: '20-20-20 휴식',
      description: '20분마다 6m(20피트) 거리를 20초간 바라본 뒤 화면으로 돌아오세요.',
    },
    'figure-eight': {
      title: '8자 추적',
      description: '30초 동안 천천히 큰 8자를 눈으로 그린 뒤 반대 방향으로 반복하세요.',
    },
  },
  localizedCopy: {
    'eye-exercise': {
      title: '눈 운동 드릴',
      description: '1분 동안 천천히 8자 움직임이나 근·원 거리 초점 전환을 따라 눈 근육을 이완하세요.',
    },
    'screen-break': {
      title: '20-20-20 화면 휴식',
      description: '20분마다 6m(20피트) 거리를 20초간 바라본 뒤 화면으로 돌아오세요.',
    },
    'vision-rest': {
      title: '손바닥 휴식',
      description: '눈을 감고 손바닥으로 가볍게 덮은 채 60초간 천천히 호흡하세요.',
    },
    hydration: {
      title: '수분 보충',
      description: '물 한 잔을 마시고 깊게 몇 번 깜빡여 눈물막을 안정시키세요.',
    },
    posture: {
      title: '화면 거리 재설정',
      description: '등을 기대고 화면 상단을 눈높이에 맞추며 팔 길이 거리를 유지하세요.',
    },
    nutrition: {
      title: '눈 건강 간식',
      description: '녹색 채소, 감귤류, 견과류 등 눈 건강에 도움이 되는 음식을 선택하세요.',
    },
    sleep: {
      title: '눈을 위한 취침 준비',
      description: '취침 30분 전 화면 밝기를 낮추고 어두운 방에서 스크롤을 피하세요.',
    },
    environment: {
      title: '조명 점검',
      description: '눈부심을 줄이고 방 조명과 화면 밝기를 맞추며 강한 천장등을 피하세요.',
    },
  },
};

const taskTabUiJa = {
  overallCompleted: '{{completed}}/{{total}} 完了',
  periodCompleted: '{{completed}}/{{total}} 完了',
  loading: '今日のプランを読み込み中…',
  translating: '選択した言語でタスクを準備中…',
  emptyTitle: 'この日のタスクはありません。',
  emptyHint: 'タスクは毎日自動で生成されます。カレンダーで別の日付を選んでください。',
  noLocaleContentTitle: 'この言語のタスク内容がありません',
  noLocaleContentHint:
    '選択した日のタスクは現在のアプリ言語では利用できません。設定で言語を変更するか、別の日付を選んでください。',
  allCompleteTitle: '今日のタスクをすべて完了！',
  allCompleteBody: '今日の目のケアルーティンをすべて終えました。よくできました。',
  errorTitle: 'プランを読み込めませんでした',
  toggleA11y: 'タスクを切り替え: {{title}}',
  period: { morning: '朝', afternoon: '午後', evening: '夕方', night: '夜' },
  periodHint: {
    morning: '1日を始めましょう',
    afternoon: '昼の習慣',
    evening: 'リラックス',
    night: '就寝前',
  },
  category: {
    'eye-exercise': '目の運動',
    'screen-break': '画面休憩',
    'vision-rest': '目の休息',
    hydration: '水分',
    posture: '姿勢',
    nutrition: '栄養',
    sleep: '睡眠',
    environment: '環境',
    'blink-drill': 'まばたきドリル',
    'coffee-gaze-break': '視線休憩',
    'near-far-focus': '近遠焦点',
    palming: 'パルミング',
    '20-20-20': '20-20-20',
    'figure-eight': '8の字',
  },
  slug: {
    'blink-drill': {
      title: 'まばたきドリル',
      description: '目をしっかり10回まばたき、休んでからあと2セット繰り返します。',
    },
    'coffee-gaze-break': {
      title: 'コーヒー視線休憩',
      description: '飲み物が冷める間、窓の外の遠くを見てください。スマホは見ないで。',
    },
    'near-far-focus': {
      title: '近遠焦点移動',
      description: '指先と遠くの物の焦点を60秒間交互に合わせます。',
    },
    palming: {
      title: 'パルミング休息',
      description: '目を閉じ、温かい手のひらで1分間軽く覆います。',
    },
    '20-20-20': {
      title: '20-20-20 休憩',
      description: '20分ごとに6m先を20秒見てから画面に戻ります。',
    },
    'figure-eight': {
      title: '8の字トレーニング',
      description: '30秒間、大きな8の字を目で描き、反対方向も行います。',
    },
  },
  localizedCopy: {
    'eye-exercise': {
      title: '目の運動ドリル',
      description: '1分間、ゆっくり8の字や近遠焦点移動で眼の筋肉をほぐします。',
    },
    'screen-break': {
      title: '20-20-20 休憩',
      description: '20分ごとに6m先を20秒見てから画面に戻りましょう。',
    },
    'vision-rest': {
      title: 'パルミング休息',
      description: '目を閉じ、手のひらで軽く覆い60秒間ゆっくり呼吸します。',
    },
    hydration: {
      title: '水分補給',
      description: '水を1杯飲み、しっかりまばたきして涙の膜を保ちます。',
    },
    posture: {
      title: '画面距離の見直し',
      description: '背筋を伸ばし、画面の上端を目の高さに、腕の長さの距離を保ちます。',
    },
    nutrition: {
      title: '目に良い軽食',
      description: '緑黄色野菜、柑橘類、ナッツなど目の健康をサポートする食事を選びましょう。',
    },
    sleep: {
      title: '就寝前の目のケア',
      description: '就寝30分前から画面を暗くし、暗い部屋でのスクロールを避けます。',
    },
    environment: {
      title: '照明チェック',
      description: '眩しさを減らし、部屋の明るさと画面を合わせ、強い天井照明を避けます。',
    },
  },
};

/** Shared English slug/theme copy for the base catalog. */
export const taskTabEnExtras = {
  periodHint: {
    morning: 'Start your day',
    afternoon: 'Midday habits',
    evening: 'Wind down',
    night: 'Before sleep',
  },
  category: {
    ...sharedCategoryEn,
  },
  slug: sharedSlugEn,
  localizedCopy: sharedThemeCopyEn,
};

export const taskTabKo = taskTabUiKo;
export const taskTabJa = taskTabUiJa;

export const taskTabZhHans = {
  overallCompleted: '已完成 {{completed}}/{{total}}',
  periodCompleted: '已完成 {{completed}}/{{total}}',
  loading: '正在加载今日计划…',
  translating: '正在以所选语言准备任务…',
  emptyTitle: '该日期暂无任务。',
  emptyHint: '任务每天会自动生成。请在日历中选择其他日期查看。',
  noLocaleContentTitle: '此语言暂无任务内容',
  noLocaleContentHint: '所选日期的任务尚未提供当前应用语言版本。请在设置中切换语言或选择其他日期。',
  allCompleteTitle: '今日任务全部完成！',
  allCompleteBody: '你已完成今天的全部护眼任务，做得很棒。',
  errorTitle: '无法加载计划',
  toggleA11y: '切换任务：{{title}}',
  period: { morning: '上午', afternoon: '下午', evening: '傍晚', night: '夜间' },
  periodHint: {
    morning: '开启新的一天',
    afternoon: '午间习惯',
    evening: '放松身心',
    night: '睡前',
  },
  category: {
    'eye-exercise': '眼部运动',
    'screen-break': '屏幕休息',
    'vision-rest': '视觉休息',
    hydration: '补水',
    posture: '姿势',
    nutrition: '营养',
    sleep: '睡眠',
    environment: '环境',
    'blink-drill': '眨眼练习',
    'coffee-gaze-break': '视线休息',
    'near-far-focus': '远近对焦',
    palming: '掌心休息',
    '20-20-20': '20-20-20',
    'figure-eight': '8字追踪',
  },
  slug: {
    'blink-drill': {
      title: '眨眼练习',
      description: '完全眨眼10次，暂停后再重复两组，刷新泪膜。',
    },
    'coffee-gaze-break': {
      title: '咖啡视线休息',
      description: '等饮料变凉时望向窗外远处——不要刷手机。',
    },
    'near-far-focus': {
      title: '远近对焦切换',
      description: '在指尖与远处物体之间交替对焦60秒。',
    },
    palming: {
      title: '掌心休息',
      description: '闭眼，用温暖的手掌轻覆一分钟。',
    },
    '20-20-20': {
      title: '20-20-20 休息',
      description: '每20分钟看6米外20秒，再回到屏幕。',
    },
    'figure-eight': {
      title: '8字追踪',
      description: '用眼睛缓慢画大8字30秒，再换方向。',
    },
  },
  localizedCopy: {
    'eye-exercise': {
      title: '眼部运动练习',
      description: '用一分钟缓慢做“8”字轨迹或远近焦点切换，放松眼肌。',
    },
    'screen-break': {
      title: '20-20-20 休息',
      description: '每20分钟看向6米外20秒，再回到屏幕。',
    },
    'vision-rest': {
      title: '掌心休息',
      description: '闭眼，用掌心轻覆双眼60秒并缓慢呼吸。',
    },
    hydration: {
      title: '补水提醒',
      description: '喝一杯水并充分眨眼，保持泪膜稳定。',
    },
    posture: {
      title: '调整屏幕距离',
      description: '坐直，屏幕顶部与眼平，保持约一臂距离。',
    },
    nutrition: {
      title: '护眼小食',
      description: '选择绿叶蔬菜、柑橘或坚果，支持长期眼健康。',
    },
    sleep: {
      title: '睡前护眼',
      description: '睡前30分钟调暗屏幕，避免在暗处刷手机。',
    },
    environment: {
      title: '检查照明',
      description: '减少眩光，让环境光与屏幕亮度匹配，避免强顶灯。',
    },
  },
} satisfies DeepPartial<typeof taskTabUiKo>;

export const taskTabFr = {
  overallCompleted: '{{completed}} sur {{total}} terminé(s)',
  periodCompleted: '{{completed}} sur {{total}} terminé(s)',
  loading: 'Chargement du plan du jour…',
  translating: 'Preparation des taches dans votre langue…',
  emptyTitle: 'Aucune tâche disponible pour cette date.',
  emptyHint:
    'Les tâches sont générées automatiquement chaque jour. Choisissez une autre date dans le calendrier.',
  noLocaleContentTitle: 'Aucun contenu de tâche pour cette langue',
  noLocaleContentHint:
    'Les tâches de ce jour ne sont pas disponibles dans la langue sélectionnée. Changez la langue dans Réglages ou choisissez une autre date.',
  allCompleteTitle: 'Toutes les tâches sont terminées !',
  allCompleteBody:
    'Vous avez terminé toutes les tâches de cette journée. Bravo pour votre routine de soin des yeux.',
  errorTitle: 'Impossible de charger le plan',
  toggleA11y: 'Basculer la tâche : {{title}}',
  period: { morning: 'Matin', afternoon: 'Après-midi', evening: 'Soir', night: 'Nuit' },
  periodHint: {
    morning: 'Commencez votre journée',
    afternoon: 'Habitudes de midi',
    evening: 'Détente',
    night: 'Avant le coucher',
  },
  category: {
    'eye-exercise': 'EXERCICE OCULAIRE',
    'screen-break': 'PAUSE ÉCRAN',
    'vision-rest': 'REPOS VISUEL',
    hydration: 'HYDRATATION',
    posture: 'POSTURE',
    nutrition: 'NUTRITION',
    sleep: 'SOMMEIL',
    environment: 'ENVIRONNEMENT',
    'blink-drill': 'CLIGNEMENT',
    'coffee-gaze-break': 'PAUSE REGARD',
    'near-far-focus': 'FOCUS PRÈS-LOIN',
    palming: 'PALMING',
    '20-20-20': '20-20-20',
    'figure-eight': 'HUIT',
  },
  slug: {
    'blink-drill': {
      title: 'Exercice de clignement',
      description: 'Clignez 10 fois, pausez, puis répétez deux fois pour rafraîchir le film lacrymal.',
    },
    'coffee-gaze-break': {
      title: 'Pause regard café',
      description: 'Regardez au loin par la fenêtre pendant que votre boisson refroidit — pas de téléphone.',
    },
    'near-far-focus': {
      title: 'Focus près-loin',
      description: 'Alternez le focus entre votre doigt et un objet lointain pendant 60 secondes.',
    },
    palming: {
      title: 'Repos paumes',
      description: 'Couvrez les yeux fermés avec vos paumes une minute sans appuyer.',
    },
    '20-20-20': {
      title: 'Pause 20-20-20',
      description: 'Toutes les 20 minutes, regardez à 6 m pendant 20 secondes.',
    },
    'figure-eight': {
      title: 'Suivi en huit',
      description: 'Tracez un grand huit avec les yeux 30 secondes dans chaque sens.',
    },
  },
  localizedCopy: {
    'eye-exercise': {
      title: 'Exercice oculaire',
      description: 'Suivez un huit lent ou un focus près-loin pendant une minute.',
    },
    'screen-break': {
      title: 'Pause 20-20-20',
      description: 'Toutes les 20 min, regardez à 6 m pendant 20 secondes.',
    },
    'vision-rest': {
      title: 'Repos paumes',
      description: 'Couvrez les yeux fermés avec vos paumes 60 secondes et respirez lentement.',
    },
    hydration: {
      title: 'Hydratation',
      description: 'Buvez un verre d’eau et clignez plusieurs fois.',
    },
    posture: {
      title: 'Distance écran',
      description: 'Asseyez-vous droit, haut d’écran à hauteur des yeux, distance d’un bras.',
    },
    nutrition: {
      title: 'Collation pour les yeux',
      description: 'Privilégiez légumes verts, agrumes ou noix.',
    },
    sleep: {
      title: 'Détente avant le coucher',
      description: 'Baissez les écrans 30 min avant le sommeil.',
    },
    environment: {
      title: 'Vérifier l’éclairage',
      description: 'Réduisez l’éblouissement et alignez la lumière ambiante sur l’écran.',
    },
  },
} satisfies DeepPartial<typeof taskTabUiKo>;

export const taskTabEs = {
  overallCompleted: '{{completed}} de {{total}} completadas',
  periodCompleted: '{{completed}} de {{total}} completadas',
  loading: 'Cargando el plan de hoy…',
  translating: 'Preparando tareas en tu idioma…',
  emptyTitle: 'No hay tareas disponibles para esta fecha.',
  emptyHint: 'Las tareas se generan automaticamente cada dia. Elige otra fecha en el calendario.',
  noLocaleContentTitle: 'No hay contenido de tareas para este idioma',
  noLocaleContentHint:
    'Las tareas de este dia no estan disponibles en el idioma seleccionado. Cambia el idioma en Ajustes o elige otra fecha.',
  allCompleteTitle: '¡Todas las tareas completadas!',
  allCompleteBody: 'Terminaste todas las tareas de este día. Excelente trabajo con tu rutina ocular.',
  errorTitle: 'No se pudo cargar el plan',
  toggleA11y: 'Alternar tarea: {{title}}',
  period: { morning: 'Mañana', afternoon: 'Tarde', evening: 'Noche', night: 'Madrugada' },
  periodHint: {
    morning: 'Empieza tu día',
    afternoon: 'Hábitos del mediodía',
    evening: 'Relájate',
    night: 'Antes de dormir',
  },
  category: {
    'eye-exercise': 'EJERCICIO OCULAR',
    'screen-break': 'PAUSA PANTALLA',
    'vision-rest': 'DESCANSO VISUAL',
    hydration: 'HIDRATACIÓN',
    posture: 'POSTURA',
    nutrition: 'NUTRICIÓN',
    sleep: 'SUEÑO',
    environment: 'ENTORNO',
    'blink-drill': 'PARPADEO',
    'coffee-gaze-break': 'PAUSA MIRADA',
    'near-far-focus': 'ENFOQUE CERCA-LEJOS',
    palming: 'PALMING',
    '20-20-20': '20-20-20',
    'figure-eight': 'OCHO',
  },
  slug: {
    'blink-drill': {
      title: 'Ejercicio de parpadeo',
      description: 'Parpadea 10 veces, pausa y repite dos veces más.',
    },
    'coffee-gaze-break': {
      title: 'Pausa de mirada con café',
      description: 'Mira a lo lejos por la ventana mientras se enfría tu bebida — sin móvil.',
    },
    'near-far-focus': {
      title: 'Enfoque cerca-lejos',
      description: 'Alterna el enfoque entre tu dedo y un objeto lejano durante 60 segundos.',
    },
    palming: {
      title: 'Descanso con palmas',
      description: 'Cubre los ojos cerrados con las palmas un minuto sin presionar.',
    },
    '20-20-20': {
      title: 'Pausa 20-20-20',
      description: 'Cada 20 minutos mira a 6 m durante 20 segundos.',
    },
    'figure-eight': {
      title: 'Seguimiento en ocho',
      description: 'Traza un ocho grande con los ojos 30 segundos en cada dirección.',
    },
  },
  localizedCopy: {
    'eye-exercise': {
      title: 'Ejercicio ocular',
      description: 'Sigue un ocho lento o enfoque cerca-lejos durante un minuto.',
    },
    'screen-break': {
      title: 'Pausa 20-20-20',
      description: 'Cada 20 minutos mira a 6 m durante 20 segundos.',
    },
    'vision-rest': {
      title: 'Descanso con palmas',
      description: 'Cierra los ojos, cúbrelos con las palmas 60 segundos y respira despacio.',
    },
    hydration: {
      title: 'Hidratación',
      description: 'Bebe un vaso de agua y parpadea bien.',
    },
    posture: {
      title: 'Distancia de pantalla',
      description: 'Siéntate erguido, pantalla a la altura de los ojos, a un brazo de distancia.',
    },
    nutrition: {
      title: 'Snack saludable para los ojos',
      description: 'Elige verduras de hoja, cítricos o frutos secos.',
    },
    sleep: {
      title: 'Relajación antes de dormir',
      description: 'Reduce pantallas 30 min antes de dormir.',
    },
    environment: {
      title: 'Revisar iluminación',
      description: 'Reduce el deslumbramiento y equilibra la luz ambiente.',
    },
  },
} satisfies DeepPartial<typeof taskTabUiKo>;

export const taskTabDe = {
  overallCompleted: '{{completed}} von {{total}} erledigt',
  periodCompleted: '{{completed}} von {{total}} erledigt',
  loading: 'Heutiger Plan wird geladen…',
  translating: 'Aufgaben werden in deiner Sprache vorbereitet…',
  emptyTitle: 'Keine Aufgaben für dieses Datum verfügbar.',
  emptyHint:
    'Aufgaben werden jeden Tag automatisch erstellt. Wahle im Kalender ein anderes Datum.',
  noLocaleContentTitle: 'Keine Aufgabeninhalte fur diese Sprache',
  noLocaleContentHint:
    'Aufgaben fur diesen Tag sind in der gewahlten Sprache nicht verfugbar. Andere die App-Sprache in den Einstellungen oder wahle ein anderes Datum.',
  allCompleteTitle: 'Alle Aufgaben erledigt!',
  allCompleteBody:
    'Du hast alle Aufgaben für diesen Tag abgeschlossen. Tolle Arbeit mit deiner Augenpflege-Routine.',
  errorTitle: 'Plan konnte nicht geladen werden',
  toggleA11y: 'Aufgabe umschalten: {{title}}',
  period: { morning: 'Morgen', afternoon: 'Nachmittag', evening: 'Abend', night: 'Nacht' },
  periodHint: {
    morning: 'Starten Sie in den Tag',
    afternoon: 'Mittagsgewohnheiten',
    evening: 'Entspannen',
    night: 'Vor dem Schlaf',
  },
  category: {
    'eye-exercise': 'AUGENÜBUNG',
    'screen-break': 'BILDSCHIRMPAUSE',
    'vision-rest': 'AUGENRUHE',
    hydration: 'FLÜSSIGKEIT',
    posture: 'HALTUNG',
    nutrition: 'ERNÄHRUNG',
    sleep: 'SCHLAF',
    environment: 'UMGEBUNG',
    'blink-drill': 'BLINZELN',
    'coffee-gaze-break': 'BLICKPAUSE',
    'near-far-focus': 'NAH-FERN',
    palming: 'PALMING',
    '20-20-20': '20-20-20',
    'figure-eight': 'ACHT',
  },
  slug: {
    'blink-drill': {
      title: 'Blinzelübung',
      description: '10-mal kräftig blinzeln, pausieren und zweimal wiederholen.',
    },
    'coffee-gaze-break': {
      title: 'Kaffee-Blickpause',
      description: 'In die Ferne schauen, während das Getränk abkühlt — kein Handy.',
    },
    'near-far-focus': {
      title: 'Nah-Fern-Fokus',
      description: '60 Sekunden zwischen Finger und entferntem Objekt wechseln.',
    },
    palming: {
      title: 'Palming-Ruhe',
      description: 'Geschlossene Augen eine Minute mit Handflächen bedecken.',
    },
    '20-20-20': {
      title: '20-20-20 Pause',
      description: 'Alle 20 Minuten 6 m weit für 20 Sekunden ansehen.',
    },
    'figure-eight': {
      title: 'Acht-Tracking',
      description: '30 Sekunden lang eine große Acht mit den Augen nachzeichnen.',
    },
  },
  localizedCopy: {
    'eye-exercise': {
      title: 'Augenübung',
      description: 'Eine Minute lang langsame Acht oder Nah-Fern-Fokus.',
    },
    'screen-break': {
      title: '20-20-20 Pause',
      description: 'Alle 20 Minuten 6 m weit für 20 Sekunden ansehen.',
    },
    'vision-rest': {
      title: 'Palming-Ruhe',
      description: 'Augen schließen, 60 Sekunden mit Handflächen bedecken und atmen.',
    },
    hydration: {
      title: 'Trinken',
      description: 'Ein Glas Wasser trinken und kräftig blinzeln.',
    },
    posture: {
      title: 'Bildschirmabstand',
      description: 'Aufrecht sitzen, Bildschirm auf Augenhöhe, armlange Entfernung.',
    },
    nutrition: {
      title: 'Augenfreundlicher Snack',
      description: 'Blattgemüse, Zitrusfrüchte oder Nüsse wählen.',
    },
    sleep: {
      title: 'Abendroutine für die Augen',
      description: '30 Min vor dem Schlaf Bildschirme dimmen.',
    },
    environment: {
      title: 'Beleuchtung prüfen',
      description: 'Blendung reduzieren und Umgebungslicht anpassen.',
    },
  },
} satisfies DeepPartial<typeof taskTabUiKo>;
