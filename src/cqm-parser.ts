interface CQMPart {
  bold: boolean
  underline: boolean
  primary: boolean
  italic: boolean
  content: string
}


export const parseCQM = (text?: string): CQMPart[] => {
  if (!text) { return [] }

  const parts: CQMPart[] = []
  const currentPart: CQMPart = {
    bold: false,
    underline: false,
    primary: false,
    italic: false,
    content: "",
  }

  const pushCurrentPart = () => {
    if (currentPart.content) {
      parts.push({ ...currentPart })

      currentPart.content = ""
    }
  }

  for (let i = 0; i < text.length; i++) {
    if (text[i] === "*" && text[i + 1] === "*") {
      pushCurrentPart()
      currentPart.bold = !currentPart.bold
      i++
    } else if (text[i] === "_" && text[i + 1] === "_") {
      pushCurrentPart()
      currentPart.underline = !currentPart.underline
      i++
    } else if (text[i] === "!" && text[i + 1] === "!") {
      pushCurrentPart()
      currentPart.primary = !currentPart.primary
      i++
    } else if (text[i] === "/" && text[i + 1] === "/") {
      pushCurrentPart()
      currentPart.italic = !currentPart.italic
      i++
    } else {
      currentPart.content += text[i]
    }
  }

  pushCurrentPart()
  return parts
}