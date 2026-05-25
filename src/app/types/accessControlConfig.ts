export interface AccessConfigListing {
  accessConfigCode: string;
  accessConfigId: string;
  micrositeSlug: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}
export interface PortalTaskConfigListing {
  portalTaskConfigCode: string;
  micrositeSlug: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BaseConfig {
  micrositeSlug: string;
  version: number;
  pages: AccessConfigPage[];
}
export interface AccessControlConfig extends BaseConfig {
  accessConfigId: string;
  accessConfigCode: string;
}

export interface PortalTaskConfig extends BaseConfig {
  portalTaskConfigCode: string;
}
export interface AccessConfigColumn {
  columnId: string;
  isVisible: boolean;
  isDisabled: boolean;
}

export interface AccessConfigComponent {
  componentId: string;
  isVisible: boolean;
  isEditable: boolean;
  isDisabled: boolean;
  isDefault?: boolean;
  isReadOnly?: boolean;
  components?: AccessConfigComponent[];
  columns?: AccessConfigColumn[];
}

export interface AccessConfigPage {
  pageCode: string;
  isVisible: boolean;
  isEditable: boolean;
  isDisabled: boolean;
  components: AccessConfigComponent[];
}

export interface AccessConfigDetail {
  accessConfigId: string;
  accessConfigCode: string;
  micrositeSlug: string;
  version: number;
  micrositeVersion?: number;
  pages: AccessConfigPage[];
}

export interface PortalTaskDetail {
  portalTaskConfigCode: string;
  micrositeSlug: string;
  version: number;
  micrositeVersion?: number;
  pages: AccessConfigPage[];
}

export interface ReconciliationResult {
  config: AccessControlConfig | PortalTaskConfig;
  newComponentIds: string[];
  removedComponentCount: number;
  newPageCodes: string[];
  removedPageCount: number;
}
