<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import {
  AdminForm,
  AdminSearchForm,
  createRangeRule,
  registerFormRules,
  useAdminForm,
  useAdminFormSubmitPage,
  z,
  type AdminFormSchema,
} from '@admin-core/form-vue';

/**
 * 通用下拉选项结构。
 */
type OptionItem = {
  /** 显示标签。 */
  label: string;
  /** 实际值。 */
  value: string;
};

/**
 * 渠道选项。
 */
const CHANNEL_OPTIONS = [
  { label: 'SaaS 渠道', value: 'saas' },
  { label: '代理商渠道', value: 'reseller' },
  { label: '私有化渠道', value: 'private' },
];

/**
 * 区域选项。
 */
const REGION_OPTIONS = [
  { label: '中国区', value: 'cn' },
  { label: '欧洲区', value: 'eu' },
  { label: '美洲区', value: 'us' },
];

/**
 * 渠道对应的产品选项映射。
 */
const PRODUCT_OPTIONS: Record<string, OptionItem[]> = {
  private: [
    { label: '私有化基础版', value: 'private-basic' },
    { label: '私有化旗舰版', value: 'private-pro' },
  ],
  reseller: [
    { label: '代理商分销版', value: 'reseller-standard' },
    { label: '代理商增值版', value: 'reseller-plus' },
  ],
  saas: [
    { label: '云原生标准版', value: 'saas-standard' },
    { label: '云原生企业版', value: 'saas-enterprise' },
  ],
};

/**
 * 区域对应的部署窗口选项映射。
 */
const DEPLOY_WINDOW_OPTIONS: Record<string, OptionItem[]> = {
  cn: [
    { label: '工作日 10:00-18:00', value: 'cn-day' },
    { label: '凌晨 01:00-05:00', value: 'cn-night' },
  ],
  eu: [
    { label: 'UTC 08:00-16:00', value: 'eu-day' },
    { label: 'UTC 18:00-22:00', value: 'eu-evening' },
  ],
  us: [
    { label: 'PST 09:00-17:00', value: 'us-day' },
    { label: 'PST 20:00-23:00', value: 'us-night' },
  ],
};

/**
 * 远程下发表单字段配置。
 */
type RemoteFieldConfig = {
  /** 显示标签。 */
  label: string;
  /** 最大输入长度。 */
  maxLength?: number;
  /** 最小输入长度。 */
  minLength?: number;
  /** 字段名。 */
  name: string;
  /** 下拉选项。 */
  options?: OptionItem[];
  /** 占位提示。 */
  placeholder?: string;
  /** 是否必填。 */
  required?: boolean;
  /** 组件类型。 */
  type: 'email' | 'password' | 'select' | 'switch' | 'text' | 'textarea';
  /** 条件展示配置。 */
  visibleWhen?: {
    /** 触发显示时的匹配值。 */
    equals: any;
    /** 依赖字段名。 */
    field: string;
  };
};

/**
 * 远程模板版本标识。
 */
type RemoteTemplate = 'advanced' | 'basic';

/**
 * 远程表单模板载荷结构。
 */
type RemoteFormPayload = {
  /** 折叠后默认展示行数。 */
  collapsedRows: number;
  /** 字段定义列表。 */
  fields: RemoteFieldConfig[];
  /** 表单标识。 */
  formId: string;
  /** 初始值。 */
  initialValues: Record<string, any>;
  /** 布局列数。 */
  layoutColumns: 1 | 2;
  /** 是否显示折叠按钮。 */
  showCollapseButton: boolean;
  /** 标题文案。 */
  title: string;
};

/**
 * 动态表单元数据摘要。
 */
type DynamicFormMeta = {
  /** 远程模板表单 ID。 */
  formId: string;
  /** 远程模板标题。 */
  title: string;
};

/**
 * 提交页展示模式。
 */
type SubmitPageMode = 'drawer' | 'modal';

/**
 * 查询提交结果快照。
 */
type QueryResultSnapshot = {
  /** 查询场景标识。 */
  scene: string;
  /** 查询参数快照。 */
  values: Record<string, any>;
};

/**
 * 注册示例中使用到的自定义校验规则。
 */
registerFormRules({
  mustBeTrue: (value) => (value === true ? true : '请先同意该项设置'),
  reservedName: async (value) => {
    await new Promise((resolve) => setTimeout(resolve, 180));
    if (!value) {
      return '请填写租户标识';
    }
    const reserved = ['admin', 'root', 'system'];
    return reserved.includes(String(value).toLowerCase())
      ? '该标识为保留字，请更换'
      : true;
  },
  strongPassword: (value) => {
    const text = String(value ?? '');
    const ok = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(text);
    return ok
      ? true
      : '密码至少 8 位，且包含大写字母、数字和特殊字符';
  },
});

/**
 * 模拟拉取远程表单模板。
 *
 * @param version 模板版本。
 * @returns 远程表单模板数据。
 */
async function fetchRemoteFormPayload(version: RemoteTemplate): Promise<RemoteFormPayload> {
  await new Promise((resolve) => setTimeout(resolve, 420));

  if (version === 'advanced') {
    return {
      collapsedRows: 2,
      formId: 'remote-advanced-v2',
      initialValues: {
        callbackUrl: '',
        contactEmail: '',
        enableWebhook: false,
        env: 'staging',
        tenantCode: '',
      },
      layoutColumns: 2,
      showCollapseButton: true,
      title: '远程高级模板（API v2）',
      fields: [
        {
          label: '租户编码',
          minLength: 4,
          name: 'tenantCode',
          placeholder: '例如 tenant-demo',
          required: true,
          type: 'text',
        },
        {
          label: '联系邮箱',
          name: 'contactEmail',
          placeholder: 'ops@example.com',
          required: true,
          type: 'email',
        },
        {
          label: '环境',
          name: 'env',
          options: [
            { label: '测试环境', value: 'staging' },
            { label: '生产环境', value: 'prod' },
          ],
          required: true,
          type: 'select',
        },
        {
          label: '启用 Webhook',
          name: 'enableWebhook',
          type: 'switch',
        },
        {
          label: 'Webhook 地址',
          name: 'callbackUrl',
          placeholder: 'https://api.example.com/webhook',
          required: true,
          type: 'text',
          visibleWhen: {
            equals: true,
            field: 'enableWebhook',
          },
        },
        {
          label: '发布说明',
          maxLength: 120,
          name: 'releaseNote',
          placeholder: '本次发布的主要变更...',
          type: 'textarea',
        },
      ],
    };
  }

  return {
    collapsedRows: 1,
    formId: 'remote-basic-v1',
    initialValues: {
      enableSso: false,
      ssoLoginUrl: '',
      tenantName: '',
      tier: 'pro',
    },
    layoutColumns: 1,
    showCollapseButton: false,
    title: '远程基础模板（API v1）',
    fields: [
      {
        label: '租户名称',
        minLength: 2,
        name: 'tenantName',
        placeholder: '请输入租户名称',
        required: true,
        type: 'text',
      },
      {
        label: '套餐',
        name: 'tier',
        options: [
          { label: '专业版', value: 'pro' },
          { label: '旗舰版', value: 'enterprise' },
        ],
        required: true,
        type: 'select',
      },
      {
        label: '启用 SSO',
        name: 'enableSso',
        type: 'switch',
      },
      {
        label: 'SSO 登录地址',
        name: 'ssoLoginUrl',
        placeholder: 'https://sso.example.com/login',
        required: true,
        type: 'text',
        visibleWhen: {
          equals: true,
          field: 'enableSso',
        },
      },
    ],
  };
}

/**
 * 将远程字段配置转换为 `AdminFormSchema`。
 *
 * @param fields 远程字段列表。
 * @returns 适配后的 schema 列表。
 */
function buildSchemaFromRemote(fields: RemoteFieldConfig[]): AdminFormSchema[] {
  return fields.map((field) => {
    const component: AdminFormSchema['component'] =
      field.type === 'email' || field.type === 'text'
        ? 'input'
        : field.type === 'password'
          ? 'password'
          : field.type === 'select'
            ? 'select'
            : field.type === 'switch'
              ? 'switch'
              : 'textarea';

    let rules: AdminFormSchema['rules'] = null;
    if (field.type === 'email') {
      const base = z.string().email(`${field.label}格式不正确`);
      rules = field.required ? base.min(1, `${field.label}不能为空`) : base;
    } else if (field.minLength && field.type !== 'switch' && field.type !== 'select') {
      rules = z.string().min(field.minLength, `${field.label}至少 ${field.minLength} 个字符`);
    } else if (field.required) {
      rules =
        field.type === 'select'
          ? 'selectRequired'
          : field.type === 'switch'
            ? 'mustBeTrue'
            : 'required';
    }

    const schema: AdminFormSchema = {
      component,
      componentProps: {
        ...(field.placeholder ? { placeholder: field.placeholder } : {}),
        ...(field.options ? { options: field.options } : {}),
        ...(field.maxLength ? { maxLength: field.maxLength } : {}),
      },
      fieldName: field.name,
      label: field.label,
      rules,
    };

    if (field.visibleWhen) {
      schema.dependencies = {
        triggerFields: [field.visibleWhen.field],
        show(values) {
          return values[field.visibleWhen!.field] === field.visibleWhen!.equals;
        },
        ...(field.required
          ? {
              required(values) {
                return values[field.visibleWhen!.field] === field.visibleWhen!.equals;
              },
            }
          : {}),
      };
    }

    return schema;
  });
}

/**
 * 将数据序列化为可读 JSON 字符串。
 *
 * @param value 任意待展示值。
 * @returns 格式化后的 JSON 文本。
 */
function toPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

/**
 * 仅校验按钮的校验结果快照。
 */
const validationCheckResult = ref<Record<string, any> | null>(null);

/**
 * 校验示例表单提交结果。
 */
const validationSubmitResult = ref<Record<string, any> | null>(null);

/**
 * 主从表单合并提交结果。
 */
const linkedSubmitResult = ref<Record<string, any> | null>(null);

/**
 * 动态表单提交结果。
 */
const dynamicSubmitResult = ref<Record<string, any> | null>(null);

/**
 * 动态表单模板元信息。
 */
const dynamicMeta = ref<DynamicFormMeta | null>(null);

/**
 * 动态模板原始载荷预览。
 */
const dynamicPreview = ref<RemoteFormPayload | null>(null);

/**
 * 当前动态模板版本。
 */
const dynamicVersion = ref<RemoteTemplate>('basic');

/**
 * 动态模板加载中状态。
 */
const dynamicLoading = ref(true);

/**
 * 分步提交页展示模式（抽屉/弹窗）。
 */
const submitPageMode = ref<SubmitPageMode>('modal');

/**
 * 分步提交页最终提交结果。
 */
const submitPageResult = ref<Record<string, any> | null>(null);

/**
 * 分步提交页打开状态。
 */
const submitPageOpenState = ref(false);

/**
 * 分步提交页当前步骤索引（从 0 开始）。
 */
const submitPageStepState = ref(0);

/**
 * 分步提交页最近外部动作结果标识。
 */
const submitPageActionResult = ref<string | null>(null);

/**
 * 条件查询示例提交结果。
 */
const queryResult = ref<QueryResultSnapshot | null>(null);

/**
 * 数据优先示例的表单值。
 */
const dataFirstValues = ref<Record<string, any>>({
  quickAgreement: false,
  quickChannel: 'saas',
  quickTenant: '',
});

/**
 * 查询模式（2/3 同行）表单值。
 */
const queryInlineValues = ref<Record<string, any>>({
  keyword: '',
  status: '',
});

/**
 * 查询模式（3/3 换行）表单值。
 */
const queryNewLineValues = ref<Record<string, any>>({
  keyword: '',
  region: '',
  status: '',
});

/**
 * 折叠查询模式表单值。
 */
const queryCollapsedValues = ref<Record<string, any>>({
  channel: '',
  keyword: '',
  owner: '',
  region: '',
  status: '',
  updatedAtRange: ['', ''],
});

/**
 * 数据优先示例 schema（v-model + schema）。
 */
const dataFirstSchema: AdminFormSchema[] = [
  {
    component: 'input',
    fieldName: 'quickTenant',
    label: '租户名称',
    rules: 'required',
  },
  {
    component: 'select',
    componentProps: {
      options: CHANNEL_OPTIONS,
    },
    fieldName: 'quickChannel',
    label: '渠道类型',
    rules: 'selectRequired',
  },
  {
    component: 'switch',
    fieldName: 'quickAgreement',
    label: '是否同意协议',
  },
  {
    component: 'textarea',
    componentProps: {
      placeholder: '仅私有化渠道显示',
    },
    dependencies: {
      show(values: Record<string, any>) {
        return values.quickChannel === 'private';
      },
      triggerFields: ['quickChannel'],
    },
    fieldName: 'quickRemark',
    label: '私有化备注',
  },
];

/**
 * 查询模式 schema：2/3 同行布局。
 */
const queryInlineSchema: AdminFormSchema[] = [
  {
    component: 'input',
    componentProps: {
      placeholder: '请输入关键词',
    },
    fieldName: 'keyword',
    label: '关键词',
  },
  {
    component: 'select',
    componentProps: {
      options: [
        { label: '全部状态', value: '' },
        { label: '启用', value: 'enabled' },
        { label: '禁用', value: 'disabled' },
      ],
      placeholder: '请选择状态',
    },
    fieldName: 'status',
    label: '状态',
  },
];

/**
 * 查询模式 schema：3/3 换行布局。
 */
const queryNewRowSchema: AdminFormSchema[] = [
  ...queryInlineSchema,
  {
    component: 'select',
    componentProps: {
      options: [{ label: '全部区域', value: '' }, ...REGION_OPTIONS],
      placeholder: '请选择区域',
    },
    fieldName: 'region',
    label: '区域',
  },
];

/**
 * 查询模式 schema：字段超出后支持折叠展开。
 */
const queryCollapsedSchema: AdminFormSchema[] = [
  {
    component: 'input',
    componentProps: {
      placeholder: '租户名称 / 编码',
    },
    fieldName: 'keyword',
    label: '关键词',
  },
  {
    component: 'select',
    componentProps: {
      options: [
        { label: '全部状态', value: '' },
        { label: '启用', value: 'enabled' },
        { label: '禁用', value: 'disabled' },
      ],
      placeholder: '状态',
    },
    fieldName: 'status',
    label: '状态',
  },
  {
    component: 'select',
    componentProps: {
      options: [{ label: '全部区域', value: '' }, ...REGION_OPTIONS],
      placeholder: '区域',
    },
    fieldName: 'region',
    label: '区域',
  },
  {
    component: 'select',
    componentProps: {
      options: [{ label: '全部渠道', value: '' }, ...CHANNEL_OPTIONS],
      placeholder: '渠道',
    },
    fieldName: 'channel',
    label: '渠道',
  },
  {
    component: 'input',
    componentProps: {
      placeholder: '负责人',
    },
    fieldName: 'owner',
    label: '负责人',
  },
  {
    component: 'range',
    componentProps: {
      endPlaceholder: '结束日期',
      startPlaceholder: '开始日期',
      type: 'date',
    },
    fieldName: 'updatedAtRange',
    label: '更新时间',
    rules: createRangeRule({
      message: '结束日期不能早于开始日期',
    }),
  },
];

/**
 * 多种校验示例表单与 API。
 */
const [ValidationForm, validationApi] = useAdminForm({
  commonConfig: {
    componentProps: {
      placeholder: '请输入',
    },
  },
  handleSubmit: (values) => {
    validationSubmitResult.value = values;
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'input',
      fieldName: 'tenantName',
      label: '租户标识',
      rules: 'reservedName',
    },
    {
      component: 'input',
      fieldName: 'email',
      label: '管理员邮箱',
      rules: z.string().min(1, '管理员邮箱不能为空').email('请输入正确邮箱'),
    },
    {
      component: 'password',
      fieldName: 'password',
      label: '密码',
      rules: 'strongPassword',
    },
    {
      component: 'password',
      dependencies: {
        rules(values) {
          return z
            .string()
            .min(1, '请再次输入密码')
            .refine((val) => val === values.password, '两次密码不一致');
        },
        triggerFields: ['password'],
      },
      fieldName: 'confirmPassword',
      label: '确认密码',
    },
    {
      component: 'switch',
      fieldName: 'agreePolicy',
      label: '同意发布规范',
      rules: 'mustBeTrue',
    },
  ],
  wrapperClass: 'admin-form__grid--1',
});

/**
 * 被联动的明细表单与 API。
 */
const [DetailForm, detailApi] = useAdminForm({
  commonConfig: {
    componentProps: {
      placeholder: '请选择或输入',
    },
  },
  layout: 'vertical',
  schema: [
    {
      component: 'select',
      componentProps: {
        options: PRODUCT_OPTIONS.saas,
      },
      fieldName: 'product',
      label: '产品版本',
      rules: 'selectRequired',
    },
    {
      component: 'select',
      componentProps: {
        options: DEPLOY_WINDOW_OPTIONS.cn,
      },
      fieldName: 'deployWindow',
      label: '可部署时段',
      rules: 'selectRequired',
    },
    {
      component: 'input',
      fieldName: 'contactEmail',
      label: '实施联系人邮箱',
      rules: z.string().email('联系人邮箱格式不正确'),
    },
    {
      component: 'textarea',
      fieldName: 'approvalNote',
      label: '审批说明(必填)',
      rules: 'required',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'admin-form__grid--1',
});

/**
 * 主表单字段联动明细表单。
 *
 * @param values 主表单当前值。
 * @param changedFields 本次变更字段名列表。
 * @returns 无返回值。
 */
const syncDetailForm = async (values: Record<string, any>, changedFields: string[]) => {
  const changed = new Set(changedFields);
  const schemaPatch: Partial<AdminFormSchema>[] = [];
  const nextValues: Record<string, any> = {};

  if (changed.has('channel')) {
    schemaPatch.push({
      componentProps: {
        options: PRODUCT_OPTIONS[values.channel] ?? [],
        placeholder: '请选择产品版本',
      },
      fieldName: 'product',
    });
    nextValues.product = '';
  }

  if (changed.has('region')) {
    schemaPatch.push({
      componentProps: {
        options: DEPLOY_WINDOW_OPTIONS[values.region] ?? [],
        placeholder: '请选择可部署时段',
      },
      fieldName: 'deployWindow',
    });
    nextValues.deployWindow = '';
  }

  if (changed.has('urgent')) {
    schemaPatch.push({
      fieldName: 'approvalNote',
      label: values.urgent ? '审批说明(可选)' : '审批说明(必填)',
      rules: values.urgent ? null : 'required',
    });
  }

  if (schemaPatch.length > 0) {
    detailApi.updateSchema(schemaPatch);
  }

  if (Object.keys(nextValues).length > 0) {
    await detailApi.setValues(nextValues, true);
  }
};

/**
 * 主表单（驱动端）与 API。
 */
const [MasterForm, masterApi] = useAdminForm({
  handleValuesChange: (values, changedFields) => {
    void syncDetailForm(values, changedFields);
  },
  layout: 'vertical',
  schema: [
    {
      component: 'select',
      componentProps: {
        options: CHANNEL_OPTIONS,
      },
      fieldName: 'channel',
      label: '渠道类型',
      rules: 'selectRequired',
    },
    {
      component: 'select',
      componentProps: {
        options: REGION_OPTIONS,
      },
      fieldName: 'region',
      label: '目标区域',
      rules: 'selectRequired',
    },
    {
      component: 'switch',
      fieldName: 'urgent',
      label: '紧急变更(可免审批)',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'admin-form__grid--1',
});

/**
 * 动态远程 schema 表单与 API。
 */
const [DynamicForm, dynamicApi] = useAdminForm({
  handleSubmit: (values) => {
    dynamicSubmitResult.value = values;
  },
  layout: 'vertical',
  schema: [],
  showDefaultActions: true,
  wrapperClass: 'admin-form__grid--1',
});

/**
 * 提交页分步定义。
 */
const submitPageSteps = [
  {
    title: '基础信息',
    columns: 2,
    sections: [
      {
        title: '租户资料',
        description: '填写租户识别信息与归属区域。',
        schema: [
          {
            component: 'input',
            fieldName: 'wizardTenantCode',
            label: '租户编码',
            rules: z.string().min(3, '租户编码至少 3 位'),
          },
          {
            component: 'input',
            fieldName: 'wizardTenantName',
            label: '租户名称',
            rules: 'required',
          },
          {
            component: 'select',
            componentProps: {
              options: REGION_OPTIONS,
              placeholder: '请选择区域',
            },
            fieldName: 'wizardRegion',
            label: '部署区域',
            rules: 'selectRequired',
          },
          {
            component: 'switch',
            fieldName: 'wizardEnableSso',
            label: '启用 SSO',
          },
        ],
      },
    ],
  },
  {
    title: '安全策略',
    columns: 2,
    sections: [
      {
        title: '管理员配置',
        description: '下一步前仅校验当前步骤字段。',
        schema: [
          {
            component: 'input',
            fieldName: 'wizardAdminEmail',
            label: '管理员邮箱',
            rules: z.string().email('请输入正确邮箱'),
          },
          {
            component: 'password',
            fieldName: 'wizardAdminPassword',
            label: '管理员密码',
            rules: 'strongPassword',
          },
          {
            component: 'password',
            dependencies: {
              rules(values: Record<string, any>) {
                return z
                  .string()
                  .min(1, '请再次输入密码')
                  .refine((value) => value === values.wizardAdminPassword, '两次密码不一致');
              },
              triggerFields: ['wizardAdminPassword'],
            },
            fieldName: 'wizardAdminPasswordConfirm',
            label: '确认密码',
          },
          {
            component: 'switch',
            fieldName: 'wizardAgreePolicy',
            label: '同意发布规范',
            rules: 'mustBeTrue',
          },
        ],
      },
    ],
  },
  {
    title: '发布配置',
    columns: 1,
    sections: [
      {
        title: '发布参数',
        schema: [
          {
            component: 'textarea',
            componentProps: {
              placeholder: '请输入发布备注',
            },
            fieldName: 'wizardReleaseNote',
            label: '发布备注',
            rules: z.string().min(6, '发布备注至少 6 个字符'),
          },
        ],
      },
    ],
  },
];

/**
 * 分步提交页组件、状态与控制器。
 */
const [SubmitPage, , submitController] = useAdminFormSubmitPage({
  animation: 'slide',
  cancelText: '取消',
  mode: 'modal',
  nextText: '下一步',
  onOpenChange: (open: boolean) => {
    submitPageOpenState.value = open;
  },
  onStepChange: (payload: { nextStep: number }) => {
    submitPageStepState.value = payload.nextStep;
  },
  onSubmit: handleSubmitPageSubmit,
  open: false,
  prevText: '上一步',
  rowColumns: 2,
  steps: submitPageSteps,
  submitText: '提交创建',
  title: '租户创建向导',
});

/**
 * 根据模板版本加载并应用远程 schema。
 *
 * @param version 模板版本。
 * @returns 无返回值。
 */
async function loadRemoteSchema(version: RemoteTemplate) {
  dynamicLoading.value = true;
  const payload = await fetchRemoteFormPayload(version);
  const schema = buildSchemaFromRemote(payload.fields);
  dynamicMeta.value = {
    formId: payload.formId,
    title: payload.title,
  };
  dynamicPreview.value = payload;
  dynamicApi.setState({
    collapsedRows: payload.collapsedRows,
    schema,
    showCollapseButton: payload.showCollapseButton,
    wrapperClass: payload.layoutColumns === 2 ? 'admin-form__grid--2' : 'admin-form__grid--1',
  });
  await dynamicApi.setValues(payload.initialValues, true);
  dynamicLoading.value = false;
}

/**
 * 仅执行校验，不提交数据。
 *
 * @returns 无返回值。
 */
async function handleValidateOnly() {
  validationCheckResult.value = await validationApi.validate();
}

/**
 * 联动提交主从表单并合并结果。
 *
 * @returns 无返回值。
 */
async function handleSubmitLinked() {
  const merged = await masterApi.merge(detailApi).submitAllForm(true);
  linkedSubmitResult.value = (merged ?? null) as Record<string, any> | null;
}

/**
 * 在远程模板 `basic/advanced` 间切换。
 *
 * @returns 无返回值。
 */
function toggleDynamicVersion() {
  dynamicVersion.value = dynamicVersion.value === 'basic' ? 'advanced' : 'basic';
}

/**
 * 处理数据驱动表单中的租户输入。
 *
 * @param event 原生输入事件。
 * @param setValue 字段值写入函数。
 * @returns 无返回值。
 */
function handleDataFirstTenantInput(event: Event, setValue: (value: any) => void) {
  const target = event.target as HTMLInputElement | null;
  setValue(target?.value ?? '');
}

/**
 * 重置数据驱动表单默认值。
 *
 * @returns 无返回值。
 */
function resetDataFirstForm() {
  dataFirstValues.value = {
    quickAgreement: false,
    quickChannel: 'saas',
    quickTenant: '',
  };
}

/**
 * 写入查询提交结果快照。
 *
 * @param scene 查询场景标识。
 * @param values 查询参数。
 * @returns 无返回值。
 */
function handleQuerySubmit(scene: string, values: Record<string, any>) {
  queryResult.value = {
    scene,
    values,
  };
}

/**
 * 处理 2/3 同行布局查询提交。
 *
 * @param values 查询参数。
 * @returns 无返回值。
 */
function handleQuerySubmitInline(values: Record<string, any>) {
  handleQuerySubmit('2/3', values);
}

/**
 * 处理 3/3 换行布局查询提交。
 *
 * @param values 查询参数。
 * @returns 无返回值。
 */
function handleQuerySubmitNewRow(values: Record<string, any>) {
  handleQuerySubmit('3/3', values);
}

/**
 * 处理折叠查询表单提交。
 *
 * @param values 查询参数。
 * @returns 无返回值。
 */
function handleQuerySubmitOverflow(values: Record<string, any>) {
  handleQuerySubmit('overflow-collapse', values);
}

/**
 * 打开步骤提交页（抽屉或弹窗模式）。
 *
 * @param mode 展示模式。
 * @returns 无返回值。
 */
function openSubmitPage(mode: 'drawer' | 'modal') {
  submitPageMode.value = mode;
  submitPageStepState.value = 0;
  submitPageOpenState.value = true;
  submitController.open();
}

/**
 * 向上一步切换。
 *
 * @returns 无返回值。
 */
async function submitPagePrev() {
  const moved = await submitController.prev();
  submitPageActionResult.value = moved ? 'moved-prev' : 'blocked';
  submitPageStepState.value = submitController.getStep();
}

/**
 * 向下一步切换并执行当前步骤校验。
 *
 * @returns 无返回值。
 */
async function submitPageNext() {
  const result = await submitController.next();
  submitPageActionResult.value = result.status;
  submitPageStepState.value = submitController.getStep();
}

/**
 * 跳转至首个步骤。
 *
 * @returns 无返回值。
 */
async function submitPageGoToFirst() {
  await submitController.goToStep(0);
  submitPageActionResult.value = 'goto-first';
  submitPageStepState.value = submitController.getStep();
}

/**
 * 跳转至最后一个步骤。
 *
 * @returns 无返回值。
 */
async function submitPageGoToLast() {
  const last = Math.max(submitController.getTotalSteps() - 1, 0);
  await submitController.goToStep(last);
  submitPageActionResult.value = 'goto-last';
  submitPageStepState.value = submitController.getStep();
}

/**
 * 关闭步骤提交页。
 *
 * @returns 无返回值。
 */
function submitPageClose() {
  submitController.close();
  submitPageOpenState.value = false;
  submitPageActionResult.value = 'closed';
}

/**
 * 处理步骤页最终提交结果。
 *
 * @param values 提交值。
 * @returns 无返回值。
 */
function handleSubmitPageSubmit(values: Record<string, any>) {
  submitPageResult.value = values;
  submitPageActionResult.value = 'submitted';
}

/**
 * 初始化默认表单值，避免首次进入时为空状态。
 */
onMounted(() => {
  void validationApi.setValues({
    agreePolicy: false,
  });

  void masterApi.setValues({
    channel: 'saas',
    region: 'cn',
    urgent: false,
  });
});

/**
 * 模板版本变化时自动刷新远程 schema。
 */
watch(
  dynamicVersion,
  (version) => {
    void loadRemoteSchema(version);
  },
  { immediate: true }
);
</script>

<template>
  <div class="page-container space-y-4">
    <h1 class="page-title">表单系统综合示例</h1>
    <p class="page-description">
      同时展示：多种校验、表单之间联动、动态表单（通过 API 结构返回 schema）。
    </p>

    <section class="card">
      <h2 class="card-title">0) 开箱即用（只关注数据）</h2>
      <p class="mb-4 text-sm text-muted-foreground">
        直接使用 `v-model:values + schema`，不需要 `formApi`；字段支持插槽扩展。
      </p>

      <AdminForm v-model:values="dataFirstValues" :schema="dataFirstSchema" :show-default-actions="false">
        <template #quickTenant="{ value, setValue }">
          <div class="space-y-1">
            <input
              class="admin-form__input"
              :value="value ?? ''"
              placeholder="请输入租户名称"
              @input="handleDataFirstTenantInput($event, setValue)"
            >
            <div class="text-xs text-muted-foreground">当前长度：{{ String(value ?? '').length }}</div>
          </div>
        </template>
      </AdminForm>

      <div class="mt-3 flex flex-wrap gap-2">
        <button class="btn btn-secondary" @click="resetDataFirstForm">重置数据驱动表单</button>
      </div>

      <pre class="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs">{{
        toPrettyJson(dataFirstValues)
      }}</pre>
    </section>

    <section class="card">
      <h2 class="card-title">0.5) 条件查询组件（AdminSearchForm / queryMode）</h2>
      <p class="mb-4 text-sm text-muted-foreground">
        展示按钮定位规则：2/3 同行右侧；3/3 新行右侧；超出默认行数时支持展开/收起。
      </p>

      <div class="space-y-4">
        <div class="rounded border border-border p-4">
          <h3 class="mb-2 text-sm font-semibold">场景 A：2/3（同行右侧）</h3>
          <AdminForm
            v-model:values="queryInlineValues"
            query-mode
            :grid-columns="3"
            :collapsed-rows="1"
            :show-collapse-button="true"
            :schema="queryInlineSchema"
            :submit-button-options="{ content: '查询' }"
            :handle-submit="handleQuerySubmitInline"
          />
        </div>

        <div class="rounded border border-border p-4">
          <h3 class="mb-2 text-sm font-semibold">场景 B：3/3（新行右侧）</h3>
          <AdminForm
            v-model:values="queryNewLineValues"
            query-mode
            :grid-columns="3"
            :collapsed-rows="1"
            :show-collapse-button="true"
            :schema="queryNewRowSchema"
            :submit-button-options="{ content: '查询' }"
            :handle-submit="handleQuerySubmitNewRow"
          />
        </div>

        <div class="rounded border border-border p-4">
          <h3 class="mb-2 text-sm font-semibold">场景 C：AdminSearchForm（默认折叠）</h3>
          <AdminSearchForm
            v-model:values="queryCollapsedValues"
            :schema="queryCollapsedSchema"
            :handle-submit="handleQuerySubmitOverflow"
          />
        </div>
      </div>

      <pre
        v-if="queryResult"
        class="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs"
      >{{ toPrettyJson(queryResult) }}</pre>
    </section>

    <section class="card">
      <h2 class="card-title">1) 多种校验能力</h2>
      <p class="mb-4 text-sm text-muted-foreground">
        内置规则 + 自定义规则 + Zod 规则 + 异步规则（保留字校验）。
      </p>
      <ValidationForm />

      <div class="mt-3 flex flex-wrap gap-2">
        <button class="btn btn-secondary" @click="validationApi.resetForm()">重置校验表单</button>
        <button class="btn btn-primary" @click="handleValidateOnly">仅执行校验</button>
      </div>

      <pre
        v-if="validationCheckResult"
        class="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs"
      >{{ toPrettyJson(validationCheckResult) }}</pre>

      <pre
        v-if="validationSubmitResult"
        class="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs"
      >{{ toPrettyJson(validationSubmitResult) }}</pre>
    </section>

    <section class="card">
      <h2 class="card-title">2) 表单之间联动</h2>
      <p class="mb-4 text-sm text-muted-foreground">
        左侧主表单控制右侧明细表单的字段配置、选项和必填状态。
      </p>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="rounded border border-border p-4">
          <h3 class="mb-3 text-base font-semibold">主表单（驱动端）</h3>
          <MasterForm />
        </div>

        <div class="rounded border border-border p-4">
          <h3 class="mb-3 text-base font-semibold">明细表单（被联动端）</h3>
          <DetailForm />
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button class="btn btn-secondary" @click="masterApi.resetForm()">重置主表单</button>
        <button class="btn btn-secondary" @click="detailApi.resetForm()">重置明细表单</button>
        <button class="btn btn-primary" @click="handleSubmitLinked">合并提交两个表单</button>
      </div>

      <pre
        v-if="linkedSubmitResult"
        class="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs"
      >{{ toPrettyJson(linkedSubmitResult) }}</pre>
    </section>

    <section class="card">
      <h2 class="card-title">3) 动态表单（API 返回 schema）</h2>
      <p class="mb-4 text-sm text-muted-foreground">
        点击切换模板后，重新请求接口并通过 Form API 注入 schema 与初始值。
      </p>

      <div class="mb-3 flex flex-wrap gap-2">
        <button class="btn btn-secondary" @click="toggleDynamicVersion">
          切换远程模板（当前：{{ dynamicVersion }}）
        </button>
        <button class="btn btn-secondary" @click="loadRemoteSchema(dynamicVersion)">重新拉取当前模板</button>
      </div>

      <div
        v-if="dynamicLoading"
        class="rounded border border-dashed border-border p-3 text-sm text-muted-foreground"
      >
        正在加载远程表单配置...
      </div>

      <template v-else>
        <div class="mb-3 rounded border border-border p-3 text-sm">
          <div>模板 ID：{{ dynamicMeta?.formId }}</div>
          <div>模板名称：{{ dynamicMeta?.title }}</div>
        </div>
        <DynamicForm />
      </template>

      <pre
        v-if="dynamicSubmitResult"
        class="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs"
      >{{ toPrettyJson(dynamicSubmitResult) }}</pre>

      <details v-if="dynamicPreview" class="mt-3 rounded border border-border p-3">
        <summary class="cursor-pointer text-sm font-medium">查看 API 原始 schema 数据</summary>
        <pre class="mt-2 overflow-auto text-xs">{{ toPrettyJson(dynamicPreview) }}</pre>
      </details>
    </section>

    <section class="card">
      <h2 class="card-title">4) 抽屉 / 弹窗分步表单</h2>
      <p class="mb-4 text-sm text-muted-foreground">
        支持分步骤、分块区域、每行列数配置；点击下一步仅校验当前步骤字段。
      </p>

      <div class="flex flex-wrap gap-2">
        <button class="btn btn-secondary" @click="openSubmitPage('modal')">打开弹窗表单</button>
        <button class="btn btn-secondary" @click="openSubmitPage('drawer')">打开抽屉表单</button>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button class="btn btn-secondary" @click="submitPagePrev">外部上一步</button>
        <button class="btn btn-secondary" @click="submitPageNext">外部下一步</button>
        <button class="btn btn-secondary" @click="submitPageGoToFirst">跳到第一步</button>
        <button class="btn btn-secondary" @click="submitPageGoToLast">跳到最后一步</button>
        <button class="btn btn-secondary" @click="submitPageClose">外部关闭</button>
      </div>

      <div class="mt-3 rounded border border-border p-3 text-sm">
        <div>打开状态：{{ submitPageOpenState ? '打开' : '关闭' }}</div>
        <div>当前步骤：{{ submitPageStepState + 1 }} / {{ submitController.getTotalSteps() }}</div>
        <div>最近外部动作：{{ submitPageActionResult ?? '-' }}</div>
      </div>

      <pre
        v-if="submitPageResult"
        class="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs"
      >{{ toPrettyJson(submitPageResult) }}</pre>
    </section>

    <SubmitPage :mode="submitPageMode" />
  </div>
</template>
