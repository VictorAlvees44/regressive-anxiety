import { useEffect } from "react";

export function useMetadadosPagina(titulo: string, descricao: string, imagem?: string) {
  useEffect(() => {
    const tituloAnterior = document.title;
    document.title = titulo + " · Regressive Anxiety";
    const alteradas: { elemento: HTMLMetaElement; anterior: string | null; criado: boolean }[] = [];
    const dados = { "description": descricao, "og:title": titulo, "og:description": descricao, "og:image": imagem ?? "", "twitter:title": titulo, "twitter:description": descricao, "twitter:image": imagem ?? "" };
    for (const [nome, conteudo] of Object.entries(dados)) {
      const atributo = nome.startsWith("og:") ? "property" : "name";
      let meta = document.head.querySelector<HTMLMetaElement>('meta[' + atributo + '="' + nome + '"]');
      const criado = !meta;
      if (!meta) { meta = document.createElement("meta"); meta.setAttribute(atributo, nome); document.head.append(meta); }
      alteradas.push({ elemento: meta, anterior: meta.getAttribute("content"), criado });
      meta.setAttribute("content", conteudo);
    }
    return () => {
      document.title = tituloAnterior;
      alteradas.forEach(({ elemento, anterior, criado }) => { if (criado) elemento.remove(); else elemento.setAttribute("content", anterior ?? ""); });
    };
  }, [titulo, descricao, imagem]);
}
