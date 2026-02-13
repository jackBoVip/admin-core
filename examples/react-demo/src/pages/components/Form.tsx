import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  AdminForm,
  AdminSearchForm,
  createRangeRule,
  registerFormRules,
  useAdminForm,
  useAdminFormSubmitPage,
  z,
  type AdminFormSchema,
} from '@admin-core/form-react';

const CHANNEL_OPTIONS = [
  { label: 'SaaS 渠道', value: 'saas' },
  { label: '代理商渠道', value: 'reseller' },
  { label: '私有化渠道', value: 'private' },
];

const REGION_OPTIONS = [
  { label: '中国区', value: 'cn' },
  { label: '欧洲区', value: 'eu' },
  { label: '美洲区', value: 'us' },
];

const PRODUCT_OPTIONS: Record<string, Array<{ label: string; value: string }>> = {
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

const DEPLOY_WINDOW_OPTIONS: Record<string, Array<{ label: string; value: string }>> = {
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

type RemoteFieldConfig = {
  label: string;
  maxLength?: number;
  minLength?: number;
  name: string;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
  type: 'email' | 'password' | 'select' | 'switch' | 'text' | 'textarea';
  visibleWhen?: {
    equals: any;
    field: string;
  };
};

type RemoteTemplate = 'advanced' | 'basic';

type RemoteFormPayload = {
  collapsedRows: number;
  fields: RemoteFieldConfig[];
  formId: string;
  initialValues: Record<string, any>;
  layoutColumns: 1 | 2;
  showCollapseButton: boolean;
  title: string;
};

let rulesRegistered = false;

function DataFirstNameInput(props: Record<string, any>) {
  const helper = props.helper as string | undefined;
  return (
    <div className="space-y-1">
      <input
        className="admin-form__input"
        disabled={props.disabled}
        onChange={props.onChange}
        placeholder={props.placeholder ?? '请输入租户名称'}
        value={props.value ?? ''}
      />
      <div className="text-xs text-muted-foreground">
        {helper ?? '可通过 renderComponentContent 注入附加信息'}
      </div>
    </div>
  );
}

function ensureRulesRegistered() {
  if (rulesRegistered) {
    return;
  }

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

  rulesRegistered = true;
}

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

export default function ComponentsForm() {
  ensureRulesRegistered();

  const [validationCheckResult, setValidationCheckResult] = useState<Record<string, any> | null>(null);
  const [validationSubmitResult, setValidationSubmitResult] = useState<Record<string, any> | null>(null);
  const [linkedSubmitResult, setLinkedSubmitResult] = useState<Record<string, any> | null>(null);
  const [dynamicSubmitResult, setDynamicSubmitResult] = useState<Record<string, any> | null>(null);
  const [dynamicMeta, setDynamicMeta] = useState<{ formId: string; title: string } | null>(null);
  const [dynamicPreview, setDynamicPreview] = useState<RemoteFormPayload | null>(null);
  const [dynamicVersion, setDynamicVersion] = useState<RemoteTemplate>('basic');
  const [dynamicLoading, setDynamicLoading] = useState(true);
  const [submitPageMode, setSubmitPageMode] = useState<'drawer' | 'modal'>('modal');
  const [submitPageResult, setSubmitPageResult] = useState<Record<string, any> | null>(null);
  const [submitPageOpenState, setSubmitPageOpenState] = useState(false);
  const [submitPageStepState, setSubmitPageStepState] = useState(0);
  const [submitPageActionResult, setSubmitPageActionResult] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<Record<string, any> | null>(null);
  const [dataFirstValues, setDataFirstValues] = useState<Record<string, any>>({
    quickAgreement: false,
    quickChannel: 'saas',
    quickTenant: '',
  });
  const [queryInlineValues, setQueryInlineValues] = useState<Record<string, any>>({
    keyword: '',
    status: '',
  });
  const [queryNewLineValues, setQueryNewLineValues] = useState<Record<string, any>>({
    keyword: '',
    region: '',
    status: '',
  });
  const [queryCollapsedValues, setQueryCollapsedValues] = useState<Record<string, any>>({
    channel: '',
    keyword: '',
    owner: '',
    region: '',
    status: '',
    updatedAtRange: ['', ''],
  });

  const dataFirstSchema = useMemo<AdminFormSchema[]>(
    () => [
      {
        component: DataFirstNameInput,
        componentProps: {
          placeholder: '请输入租户名称',
        },
        fieldName: 'quickTenant',
        label: '租户名称',
        renderComponentContent: (values: Record<string, any>) => ({
          helper: `当前长度：${String(values.quickTenant ?? '').length}`,
        }),
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
    ],
    []
  );
  const queryInlineSchema = useMemo<AdminFormSchema[]>(
    () => [
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
    ],
    []
  );
  const queryNewRowSchema = useMemo<AdminFormSchema[]>(
    () => [
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
    ],
    [queryInlineSchema]
  );
  const queryCollapsedSchema = useMemo<AdminFormSchema[]>(
    () => [
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
          options: [{ label: '全部状态', value: '' }, { label: '启用', value: 'enabled' }, { label: '禁用', value: 'disabled' }],
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
    ],
    []
  );

  const [ValidationForm, validationApi] = useAdminForm(
    useMemo(
      () => ({
        commonConfig: {
          componentProps: {
            placeholder: '请输入',
          },
        },
        handleSubmit: (values: Record<string, any>) => {
          setValidationSubmitResult(values);
        },
        layout: 'horizontal' as const,
        schema: [
          {
            component: 'input' as const,
            fieldName: 'tenantName',
            label: '租户标识',
            rules: 'reservedName' as const,
          },
          {
            component: 'input' as const,
            fieldName: 'email',
            label: '管理员邮箱',
            rules: z
              .string()
              .min(1, '管理员邮箱不能为空')
              .email('请输入正确邮箱'),
          },
          {
            component: 'password' as const,
            fieldName: 'password',
            label: '密码',
            rules: 'strongPassword' as const,
          },
          {
            component: 'password' as const,
            dependencies: {
              rules(values: Record<string, any>) {
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
            component: 'switch' as const,
            fieldName: 'agreePolicy',
            label: '同意发布规范',
            rules: 'mustBeTrue' as const,
          },
        ],
        wrapperClass: 'admin-form__grid--1',
      }),
      []
    )
  );

  const [DetailForm, detailApi] = useAdminForm(
    useMemo(
      () => ({
        commonConfig: {
          componentProps: {
            placeholder: '请选择或输入',
          },
        },
        layout: 'vertical' as const,
        schema: [
          {
            component: 'select' as const,
            componentProps: {
              options: PRODUCT_OPTIONS.saas,
            },
            fieldName: 'product',
            label: '产品版本',
            rules: 'selectRequired' as const,
          },
          {
            component: 'select' as const,
            componentProps: {
              options: DEPLOY_WINDOW_OPTIONS.cn,
            },
            fieldName: 'deployWindow',
            label: '可部署时段',
            rules: 'selectRequired' as const,
          },
          {
            component: 'input' as const,
            fieldName: 'contactEmail',
            label: '实施联系人邮箱',
            rules: z.string().email('联系人邮箱格式不正确'),
          },
          {
            component: 'textarea' as const,
            fieldName: 'approvalNote',
            label: '审批说明(必填)',
            rules: 'required' as const,
          },
        ],
        showDefaultActions: false,
        wrapperClass: 'admin-form__grid--1',
      }),
      []
    )
  );

  const syncDetailForm = useCallback(
    async (values: Record<string, any>, changedFields: string[]) => {
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
    },
    [detailApi]
  );

  const [MasterForm, masterApi] = useAdminForm(
    useMemo(
      () => ({
        handleValuesChange: (values: Record<string, any>, changedFields: string[]) => {
          void syncDetailForm(values, changedFields);
        },
        layout: 'vertical' as const,
        schema: [
          {
            component: 'select' as const,
            componentProps: {
              options: CHANNEL_OPTIONS,
            },
            fieldName: 'channel',
            label: '渠道类型',
            rules: 'selectRequired' as const,
          },
          {
            component: 'select' as const,
            componentProps: {
              options: REGION_OPTIONS,
            },
            fieldName: 'region',
            label: '目标区域',
            rules: 'selectRequired' as const,
          },
          {
            component: 'switch' as const,
            fieldName: 'urgent',
            label: '紧急变更(可免审批)',
          },
        ],
        showDefaultActions: false,
        wrapperClass: 'admin-form__grid--1',
      }),
      [syncDetailForm]
    )
  );

  const [DynamicForm, dynamicApi] = useAdminForm(
    useMemo(
      () => ({
        handleSubmit: (values: Record<string, any>) => {
          setDynamicSubmitResult(values);
        },
        layout: 'vertical' as const,
        schema: [],
        showDefaultActions: true,
        wrapperClass: 'admin-form__grid--1',
      }),
      []
    )
  );

  const loadRemoteSchema = useCallback(
    async (version: RemoteTemplate) => {
      setDynamicLoading(true);
      const payload = await fetchRemoteFormPayload(version);
      const schema = buildSchemaFromRemote(payload.fields);
      setDynamicMeta({
        formId: payload.formId,
        title: payload.title,
      });
      setDynamicPreview(payload);
      dynamicApi.setState({
        collapsedRows: payload.collapsedRows,
        schema,
        showCollapseButton: payload.showCollapseButton,
        wrapperClass:
          payload.layoutColumns === 2 ? 'admin-form__grid--2' : 'admin-form__grid--1',
      });
      await dynamicApi.setValues(payload.initialValues, true);
      setDynamicLoading(false);
    },
    [dynamicApi]
  );

  useEffect(() => {
    void validationApi.setValues({
      agreePolicy: false,
    });

    void masterApi.setValues({
      channel: 'saas',
      region: 'cn',
      urgent: false,
    });
  }, [masterApi, validationApi]);

  useEffect(() => {
    void loadRemoteSchema(dynamicVersion);
  }, [dynamicVersion, loadRemoteSchema]);

  const handleValidateOnly = useCallback(async () => {
    const result = await validationApi.validate();
    setValidationCheckResult(result);
  }, [validationApi]);

  const handleSubmitLinked = useCallback(async () => {
    const merged = await masterApi.merge(detailApi).submitAllForm(true);
    setLinkedSubmitResult((merged ?? null) as Record<string, any> | null);
  }, [detailApi, masterApi]);

  const submitPageSteps = useMemo(
    () => [
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
                      .refine(
                        (value) => value === values.wizardAdminPassword,
                        '两次密码不一致'
                      );
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
    ],
    []
  );
  const [SubmitPage, , submitController] = useAdminFormSubmitPage(
    useMemo(
      () => ({
        animation: 'slide' as const,
        cancelText: '取消',
        mode: 'modal' as const,
        nextText: '下一步',
        onOpenChange: (open: boolean) => {
          setSubmitPageOpenState(open);
        },
        onStepChange: (payload: { nextStep: number }) => {
          setSubmitPageStepState(payload.nextStep);
        },
        onSubmit: async (values: Record<string, any>) => {
          setSubmitPageResult(values);
          setSubmitPageActionResult('submitted');
        },
        open: false,
        prevText: '上一步',
        rowColumns: 2,
        steps: submitPageSteps,
        submitText: '提交创建',
        title: '租户创建向导',
      }),
      [submitPageSteps]
    )
  );

  const syncSubmitPageStepState = useCallback(() => {
    setSubmitPageStepState(submitController.getStep());
  }, [submitController]);

  const handleSubmitPagePrev = useCallback(async () => {
    const moved = await submitController.prev();
    setSubmitPageActionResult(moved ? 'moved-prev' : 'blocked');
    syncSubmitPageStepState();
  }, [submitController, syncSubmitPageStepState]);

  const handleSubmitPageNext = useCallback(async () => {
    const result = await submitController.next();
    setSubmitPageActionResult(result.status);
    syncSubmitPageStepState();
  }, [submitController, syncSubmitPageStepState]);

  const handleSubmitPageGoToFirst = useCallback(async () => {
    await submitController.goToStep(0);
    setSubmitPageActionResult('goto-first');
    syncSubmitPageStepState();
  }, [submitController, syncSubmitPageStepState]);

  const handleSubmitPageGoToLast = useCallback(async () => {
    const last = Math.max(submitController.getTotalSteps() - 1, 0);
    await submitController.goToStep(last);
    setSubmitPageActionResult('goto-last');
    syncSubmitPageStepState();
  }, [submitController, syncSubmitPageStepState]);

  const handleSubmitPageClose = useCallback(() => {
    submitController.close();
    setSubmitPageActionResult('closed');
  }, [submitController]);

  return (
    <div className="page-container space-y-4">
      <h1 className="page-title">表单系统综合示例</h1>
      <p className="page-description">
        同时展示：多种校验、表单之间联动、动态表单（通过 API 结构返回 schema）。
      </p>

      <section className="card">
        <h2 className="card-title">0) 开箱即用（只关注数据）</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          直接用 `values + onValuesChange + schema`。不需要 `formApi`，支持内容注入。
        </p>

        <AdminForm
          schema={dataFirstSchema}
          showDefaultActions={false}
          values={dataFirstValues}
          onValuesChange={setDataFirstValues}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="btn btn-secondary"
            onClick={() =>
              setDataFirstValues({
                quickAgreement: false,
                quickChannel: 'saas',
                quickTenant: '',
              })
            }
          >
            重置数据驱动表单
          </button>
        </div>

        <pre className="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs">
          {JSON.stringify(dataFirstValues, null, 2)}
        </pre>
      </section>

      <section className="card">
        <h2 className="card-title">0.5) 条件查询组件（AdminSearchForm / queryMode）</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          展示按钮定位规则：2/3 同行右侧；3/3 新行右侧；超出默认行数时支持展开/收起。
        </p>

        <div className="space-y-4">
          <div className="rounded border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold">场景 A：2/3（同行右侧）</h3>
            <AdminForm
              queryMode
              gridColumns={3}
              collapsedRows={1}
              showCollapseButton
              schema={queryInlineSchema}
              values={queryInlineValues}
              onValuesChange={setQueryInlineValues}
              submitButtonOptions={{ content: '查询' }}
              handleSubmit={(values) => {
                setQueryResult({ scene: '2/3', values });
              }}
            />
          </div>

          <div className="rounded border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold">场景 B：3/3（新行右侧）</h3>
            <AdminForm
              queryMode
              gridColumns={3}
              collapsedRows={1}
              showCollapseButton
              schema={queryNewRowSchema}
              values={queryNewLineValues}
              onValuesChange={setQueryNewLineValues}
              submitButtonOptions={{ content: '查询' }}
              handleSubmit={(values) => {
                setQueryResult({ scene: '3/3', values });
              }}
            />
          </div>

          <div className="rounded border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold">场景 C：AdminSearchForm（默认折叠）</h3>
            <AdminSearchForm
              schema={queryCollapsedSchema}
              values={queryCollapsedValues}
              onValuesChange={setQueryCollapsedValues}
              handleSubmit={(values) => {
                setQueryResult({ scene: 'overflow-collapse', values });
              }}
            />
          </div>
        </div>

        {queryResult ? (
          <pre className="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs">
            {JSON.stringify(queryResult, null, 2)}
          </pre>
        ) : null}
      </section>

      <section className="card">
        <h2 className="card-title">1) 多种校验能力</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          内置规则 + 自定义规则 + Zod 规则 + 异步规则（保留字校验）。
        </p>
        <ValidationForm />

        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-secondary" onClick={() => void validationApi.resetForm()}>
            重置校验表单
          </button>
          <button className="btn btn-primary" onClick={() => void handleValidateOnly()}>
            仅执行校验
          </button>
        </div>

        {validationCheckResult ? (
          <pre className="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs">
            {JSON.stringify(validationCheckResult, null, 2)}
          </pre>
        ) : null}

        {validationSubmitResult ? (
          <pre className="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs">
            {JSON.stringify(validationSubmitResult, null, 2)}
          </pre>
        ) : null}
      </section>

      <section className="card">
        <h2 className="card-title">2) 表单之间联动</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          左侧主表单控制右侧明细表单的字段配置、选项和必填状态。
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded border border-border p-4">
            <h3 className="mb-3 text-base font-semibold">主表单（驱动端）</h3>
            <MasterForm />
          </div>

          <div className="rounded border border-border p-4">
            <h3 className="mb-3 text-base font-semibold">明细表单（被联动端）</h3>
            <DetailForm />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-secondary" onClick={() => void masterApi.resetForm()}>
            重置主表单
          </button>
          <button className="btn btn-secondary" onClick={() => void detailApi.resetForm()}>
            重置明细表单
          </button>
          <button className="btn btn-primary" onClick={() => void handleSubmitLinked()}>
            合并提交两个表单
          </button>
        </div>

        {linkedSubmitResult ? (
          <pre className="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs">
            {JSON.stringify(linkedSubmitResult, null, 2)}
          </pre>
        ) : null}
      </section>

      <section className="card">
        <h2 className="card-title">3) 动态表单（API 返回 schema）</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          点击切换模板后，重新请求接口并通过 Form API 注入 schema 与初始值。
        </p>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => setDynamicVersion((prev) => (prev === 'basic' ? 'advanced' : 'basic'))}
          >
            切换远程模板（当前：{dynamicVersion}）
          </button>
          <button className="btn btn-secondary" onClick={() => void loadRemoteSchema(dynamicVersion)}>
            重新拉取当前模板
          </button>
        </div>

        {dynamicLoading ? (
          <div className="rounded border border-dashed border-border p-3 text-sm text-muted-foreground">
            正在加载远程表单配置...
          </div>
        ) : (
          <>
            <div className="mb-3 rounded border border-border p-3 text-sm">
              <div>模板 ID：{dynamicMeta?.formId}</div>
              <div>模板名称：{dynamicMeta?.title}</div>
            </div>
            <DynamicForm />
          </>
        )}

        {dynamicSubmitResult ? (
          <pre className="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs">
            {JSON.stringify(dynamicSubmitResult, null, 2)}
          </pre>
        ) : null}

        {dynamicPreview ? (
          <details className="mt-3 rounded border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium">查看 API 原始 schema 数据</summary>
            <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(dynamicPreview, null, 2)}</pre>
          </details>
        ) : null}
      </section>

      <section className="card">
        <h2 className="card-title">4) 抽屉 / 弹窗分步表单</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          支持分步骤、分块区域、每行列数配置；点击下一步仅校验当前步骤字段。
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSubmitPageMode('modal');
              setSubmitPageStepState(0);
              submitController.open();
            }}
          >
            打开弹窗表单
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSubmitPageMode('drawer');
              setSubmitPageStepState(0);
              submitController.open();
            }}
          >
            打开抽屉表单
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-secondary" onClick={() => void handleSubmitPagePrev()}>
            外部上一步
          </button>
          <button className="btn btn-secondary" onClick={() => void handleSubmitPageNext()}>
            外部下一步
          </button>
          <button className="btn btn-secondary" onClick={() => void handleSubmitPageGoToFirst()}>
            跳到第一步
          </button>
          <button className="btn btn-secondary" onClick={() => void handleSubmitPageGoToLast()}>
            跳到最后一步
          </button>
          <button className="btn btn-secondary" onClick={handleSubmitPageClose}>
            外部关闭
          </button>
        </div>

        <div className="mt-3 rounded border border-border p-3 text-sm">
          <div>打开状态：{submitPageOpenState ? '打开' : '关闭'}</div>
          <div>
            当前步骤：{submitPageStepState + 1} / {submitController.getTotalSteps()}
          </div>
          <div>最近外部动作：{submitPageActionResult ?? '-'}</div>
        </div>

        {submitPageResult ? (
          <pre className="mt-3 overflow-auto rounded border border-border bg-muted p-3 text-xs">
            {JSON.stringify(submitPageResult, null, 2)}
          </pre>
        ) : null}
      </section>

      <SubmitPage mode={submitPageMode} />
    </div>
  );
}
