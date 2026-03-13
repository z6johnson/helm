import type {
  DashboardTask,
  Quarter,
  MeasurementDimension,
  MeasurementPayload,
  MeasurementIndicator,
  ManualMeasurements,
  DimensionAlignment,
} from './types';
import { FIELD_IDS } from './types';

// === Indicator Definitions ===

interface IndicatorDef {
  key: string;
  label: string;
  source: 'clickup' | 'manual';
  type: 'leading' | 'lagging';
  unit: string;
}

interface DimensionDef {
  id: string;
  title: string;
  subtitle: string;
  indicators: IndicatorDef[];
  alignment: DimensionAlignment[];
}

const DIMENSIONS: DimensionDef[] = [
  {
    id: 'operational',
    title: 'Operational Capacity & Efficiency',
    subtitle: 'Does AI strategy work help UCSD do more with what it has?',
    indicators: [
      // Leading
      { key: 'op_intake_scoped', label: 'Intake engagements scoped', source: 'clickup', type: 'leading', unit: 'count' },
      { key: 'op_scoping_completeness', label: 'Scoping completeness', source: 'clickup', type: 'leading', unit: 'percent' },
      { key: 'op_scoping_quality', label: 'Scoping documentation quality', source: 'manual', type: 'leading', unit: 'score' },
      { key: 'op_depts_engaged', label: 'Departments in pipeline', source: 'clickup', type: 'leading', unit: 'count' },
      // Lagging
      { key: 'op_time_savings', label: 'Time savings (hours)', source: 'manual', type: 'lagging', unit: 'hours' },
      { key: 'op_manual_steps_reduced', label: 'Manual steps reduced', source: 'manual', type: 'lagging', unit: 'count' },
      { key: 'op_repeat_rate', label: 'Repeat engagement rate', source: 'manual', type: 'lagging', unit: 'percent' },
      { key: 'op_net_capacity', label: 'Net capacity gained (FTE equiv)', source: 'manual', type: 'lagging', unit: 'count' },
    ],
    alignment: [
      { advances: 'Sustainable Infrastructure', strategicPlan: 'Operational Alignment', ucPrinciple: 'Appropriateness' },
      { advances: 'VCFA cost/revenue priority', strategicPlan: 'Operational Alignment', ucPrinciple: 'Accuracy & Reliability' },
      { advances: 'People and Purpose', strategicPlan: 'Faculty and Staff Support', ucPrinciple: 'Shared Benefit' },
    ],
  },
  {
    id: 'readiness',
    title: 'Institutional AI Readiness',
    subtitle: 'Is UCSD\'s staff and administration becoming more capable and responsible in how it uses AI?',
    indicators: [
      // Leading
      { key: 'rd_workshop_attendance', label: 'Workshop attendance', source: 'manual', type: 'leading', unit: 'count' },
      { key: 'rd_units_completed_intake', label: 'Units completed intake', source: 'clickup', type: 'leading', unit: 'count' },
      { key: 'rd_campus_breadth', label: 'Campus representation breadth', source: 'clickup', type: 'leading', unit: 'count' },
      { key: 'rd_vcfa_engagement', label: 'VCFA-area departments engaged', source: 'manual', type: 'leading', unit: 'count' },
      // Lagging
      { key: 'rd_practice_changes', label: 'Units changed practices', source: 'manual', type: 'lagging', unit: 'count' },
      { key: 'rd_policy_guidance', label: 'Policy/guidance incorporating AI work', source: 'manual', type: 'lagging', unit: 'count' },
      { key: 'rd_request_sophistication', label: 'Request sophistication growth', source: 'manual', type: 'lagging', unit: 'score' },
      { key: 'rd_procurement_reduction', label: 'Duplicative procurement reduced', source: 'manual', type: 'lagging', unit: 'count' },
    ],
    alignment: [
      { advances: 'People and Purpose', strategicPlan: 'Faculty and Staff Support', ucPrinciple: 'Transparency' },
      { advances: 'Sustainable Infrastructure', strategicPlan: 'Operational Alignment', ucPrinciple: 'Human Values' },
      { advances: 'VCFA administrative support', strategicPlan: 'Faculty and Staff Support', ucPrinciple: 'Accountability' },
    ],
  },
  {
    id: 'risk',
    title: 'Risk Reduction & Principled Adoption',
    subtitle: 'Is this role preventing bad outcomes, not just enabling good ones?',
    indicators: [
      // Leading
      { key: 'rk_declined_delayed', label: 'Engagements declined/delayed', source: 'manual', type: 'leading', unit: 'count' },
      { key: 'rk_issues_identified', label: 'Issues identified in scoping', source: 'manual', type: 'leading', unit: 'count' },
      { key: 'rk_principles_assessed', label: 'Assessed against UC AI Principles', source: 'clickup', type: 'leading', unit: 'percent' },
      // Lagging
      { key: 'rk_compliance_incidents', label: 'Compliance incidents (intake units)', source: 'manual', type: 'lagging', unit: 'count' },
      { key: 'rk_principles_alignment', label: 'UC principles alignment score', source: 'manual', type: 'lagging', unit: 'score' },
      { key: 'rk_shadow_ai_reduction', label: 'Shadow AI procurement reduced', source: 'manual', type: 'lagging', unit: 'count' },
    ],
    alignment: [
      { advances: 'Sustainable Infrastructure', strategicPlan: 'Operational Alignment', ucPrinciple: 'Appropriateness' },
      { advances: 'VCFA solid financial foundation', strategicPlan: 'Operational Alignment', ucPrinciple: 'Privacy & Security' },
      { advances: 'Accountability', strategicPlan: 'Operational Alignment', ucPrinciple: 'Fairness & Non-Discrimination' },
    ],
  },
  {
    id: 'influence',
    title: 'System-Level Influence',
    subtitle: 'Does UCSD\'s AI strategy work shape how the UC system approaches AI governance and adoption?',
    indicators: [
      // Leading
      { key: 'in_ucop_contributions', label: 'UCOP AI Council contributions', source: 'manual', type: 'leading', unit: 'count' },
      { key: 'in_frameworks_shared', label: 'Frameworks shared with UC campuses', source: 'manual', type: 'leading', unit: 'count' },
      { key: 'in_consultation_requests', label: 'Peer consultation requests', source: 'manual', type: 'leading', unit: 'count' },
      // Lagging
      { key: 'in_approaches_adopted', label: 'Approaches adopted by other UCs', source: 'manual', type: 'lagging', unit: 'count' },
      { key: 'in_system_policy_input', label: 'System policy reflecting UCSD input', source: 'manual', type: 'lagging', unit: 'count' },
      { key: 'in_external_recognition', label: 'External recognition events', source: 'manual', type: 'lagging', unit: 'count' },
    ],
    alignment: [
      { advances: 'Community Partnership', strategicPlan: 'Regional Progress', ucPrinciple: 'Shared Benefit & Prosperity' },
      { advances: 'High-Impact Research', strategicPlan: 'Research Foundations', ucPrinciple: 'Accountability' },
      { advances: 'VCFA long-term strategy', strategicPlan: 'Strategic Internationalization', ucPrinciple: 'Transparency' },
    ],
  },
];

// === Quarter Utilities ===

export function getCurrentQuarter(): Quarter {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

export function getAvailableQuarters(): Quarter[] {
  const quarters: Quarter[] = [];
  const startYear = 2025;
  const startQ = 1;
  const now = new Date();
  const endYear = now.getFullYear();
  const endQ = Math.ceil((now.getMonth() + 1) / 3);

  for (let y = startYear; y <= endYear; y++) {
    const firstQ = y === startYear ? startQ : 1;
    const lastQ = y === endYear ? endQ : 4;
    for (let q = firstQ; q <= lastQ; q++) {
      quarters.push(`${y}-Q${q}`);
    }
  }
  return quarters;
}

export function getQuarterDateRange(quarter: Quarter): { start: number; end: number } {
  const match = quarter.match(/^(\d{4})-Q([1-4])$/);
  if (!match) throw new Error(`Invalid quarter format: ${quarter}`);
  const year = parseInt(match[1], 10);
  const q = parseInt(match[2], 10);
  const startMonth = (q - 1) * 3; // 0-indexed
  const start = new Date(year, startMonth, 1).getTime();
  const end = new Date(year, startMonth + 3, 1).getTime(); // first day of next quarter
  return { start, end };
}

export function formatQuarterLabel(quarter: Quarter): string {
  const match = quarter.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return quarter;
  return `Q${match[2]} ${match[1]}`;
}

// === Auto-Computed Metrics ===

const SCOPING_FIELDS = [
  FIELD_IDS.TYPE_OF_PROJECT,
  FIELD_IDS.SERVICE_LINE,
  FIELD_IDS.VC_AREA_ORG,
  FIELD_IDS.PROJECT_SPONSOR,
  FIELD_IDS.REQUEST,
  FIELD_IDS.OBJECTIVES,
];

function hasFieldValue(task: DashboardTask, fieldId: string): boolean {
  const field = task.customFields[fieldId];
  if (!field) return false;
  const v = field.value;
  if (v === null || v === undefined) return false;
  if (typeof v === 'string' && v.trim() === '') return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

export function computeAutoMetrics(
  tasks: DashboardTask[],
  quarter: Quarter
): ManualMeasurements {
  const { start, end } = getQuarterDateRange(quarter);
  const quarterTasks = tasks.filter(
    (t) => t.dateCreated >= start && t.dateCreated < end
  );
  const intakeTasks = quarterTasks.filter((t) => t.source === 'intake');

  // op_intake_scoped: intake tasks created in this quarter
  const opIntakeScoped = intakeTasks.length;

  // op_scoping_completeness: % of intake tasks with all scoping fields filled
  const scopingScores = intakeTasks.map((t) => {
    const filled = SCOPING_FIELDS.filter((fid) => hasFieldValue(t, fid)).length;
    return filled / SCOPING_FIELDS.length;
  });
  const opScopingCompleteness =
    intakeTasks.length > 0
      ? Math.round(
          (scopingScores.reduce((a, b) => a + b, 0) / intakeTasks.length) * 100
        )
      : null;

  // op_depts_engaged: distinct VC_AREA_ORG values
  const vcAreas = new Set<string>();
  for (const t of intakeTasks) {
    const field = t.customFields[FIELD_IDS.VC_AREA_ORG];
    if (field && field.value && typeof field.value === 'string') {
      vcAreas.add(field.value);
    }
  }
  const opDeptsEngaged = vcAreas.size;

  // rd_units_completed_intake: same as distinct VC areas (proxy)
  const rdUnitsCompleted = vcAreas.size;

  // rd_campus_breadth: same set size
  const rdCampusBreadth = vcAreas.size;

  // rk_principles_assessed: % of intake tasks with complete scoping (proxy for assessment)
  const fullyScoped = intakeTasks.filter((t) =>
    SCOPING_FIELDS.every((fid) => hasFieldValue(t, fid))
  ).length;
  const rkPrinciplesAssessed =
    intakeTasks.length > 0
      ? Math.round((fullyScoped / intakeTasks.length) * 100)
      : null;

  return {
    op_intake_scoped: opIntakeScoped,
    op_scoping_completeness: opScopingCompleteness,
    op_depts_engaged: opDeptsEngaged,
    rd_units_completed_intake: rdUnitsCompleted,
    rd_campus_breadth: rdCampusBreadth,
    rk_principles_assessed: rkPrinciplesAssessed,
  };
}

// === Payload Builder ===

export function buildMeasurementPayload(
  tasks: DashboardTask[],
  manualData: ManualMeasurements | null,
  quarter: Quarter
): MeasurementPayload {
  const auto = computeAutoMetrics(tasks, quarter);
  const manual = manualData ?? {};

  const dimensions: MeasurementDimension[] = DIMENSIONS.map((dim) => {
    const leading: MeasurementIndicator[] = [];
    const lagging: MeasurementIndicator[] = [];

    for (const ind of dim.indicators) {
      const value =
        ind.source === 'clickup'
          ? (auto[ind.key] ?? null)
          : (manual[ind.key] ?? null);

      const indicator: MeasurementIndicator = {
        key: ind.key,
        label: ind.label,
        value,
        source: ind.source,
        type: ind.type,
        unit: ind.unit,
      };

      if (ind.type === 'leading') {
        leading.push(indicator);
      } else {
        lagging.push(indicator);
      }
    }

    return {
      id: dim.id,
      title: dim.title,
      subtitle: dim.subtitle,
      leading,
      lagging,
      alignment: dim.alignment,
    };
  });

  return {
    quarter,
    dimensions,
    lastUpdated: manual._lastUpdated as number | null ?? null,
  };
}
