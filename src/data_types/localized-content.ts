export enum LocalizedContentType {
  CQM = 'CQM',
  md = 'md'
}

export enum AttributionType {
  style = 'style',
  template = 'template'
}

export type StyleAttribution = {
  type: AttributionType.style;
  styleKey: string;
  start: number;
  end: number;
}

export type TemplateAttribution = {
  type: AttributionType.template;
  templateKey: string;
  position: number;
}


export type Attribution = StyleAttribution | TemplateAttribution;

export type LocalizedCQMContent = {
  type: LocalizedContentType.CQM;
  content: string;
  attributions: Array<Attribution>;
}

export type LocalizedMDContent = {
  type: LocalizedContentType.md;
  content: string;
}

export type LocalizedContent = LocalizedCQMContent | LocalizedMDContent;

export type LocalizedContentTranslation = {
  [contentKey: string]: LocalizedContent;
}