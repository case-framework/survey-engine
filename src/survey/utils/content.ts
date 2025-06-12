export enum ContentType {
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


// TODO: create JSON schema
// TODO: create classes to represent the content

export type CQMContent = {
  type: ContentType.CQM;
  content: string;
  attributions?: Array<Attribution>;
}

export type MDContent = {
  type: ContentType.md;
  content: string;
}

export type Content = CQMContent | MDContent;

