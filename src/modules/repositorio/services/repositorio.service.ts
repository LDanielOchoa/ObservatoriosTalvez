import type { DocumentoRepositorio } from "./repositorio.types";

/**
 * Servicio de documentos del Repositorio con fichas técnicas y referencias APA
 */
export class ServicioRepositorio {
  private static documentos: DocumentoRepositorio[] = [
    {
      id: "doc-1",
      ano: "2026",
      lineaInvestigacion: "Migración Latinoamericana",
      titulo: "Comportamiento de los estudios globales sobre migración en América Latina: Un tratamiento cienciométrico mediante Scopus",
      tipoFuente: "Revistas especializadas",
      pais: "Colombia",
      autores: [
        "Alejandro Fernando Haro Sarango",
        "Mirian Noemí Carranza Guerrero",
        "Silvia Guadalupe Naranjo Lozada",
        "Oscar Patricio López Solís",
      ],
      enlaceDocumento: "#",
      resumen:
        "La migración es uno de los eventos con gran trascendencia en el mundo, y tema de constante discusión por la afección socioeconómica del país de origen y el receptor de migrantes. Este estudio diseña un análisis bibliométrico de la producción científica en Scopus sobre la migración en América Latina mediante el software estadístico RStudio.",
      referenciaApa:
        "Sarango, A. F. H., Guerrero, M. N. C., Lozada, S. G. N. & Solís, O. P. L. (2024). Comportamiento de los estudios globales sobre migración en América Latina: Un tratamiento cienciométrico mediante Scopus. Bitácora Urbano Territorial, 34(1).",
    },
    {
      id: "doc-2",
      ano: "2025",
      lineaInvestigacion: "Educación Superior",
      titulo: "Impacto de las políticas públicas en la cobertura de educación superior regional en Colombia (2018-2025)",
      tipoFuente: "Informe técnico",
      pais: "Colombia",
      autores: [
        "María Helena Villamizar",
        "Carlos Eduardo Restrepo",
        "Daniela Salazar Nieto",
      ],
      enlaceDocumento: "#",
      resumen:
        "Evaluación cuantitativa y cualitativa de los programas de acceso, gratuidad y permanencia estudiantil en instituciones universitarias regionales.",
      referenciaApa:
        "Villamizar, M. H., Restrepo, C. E. & Salazar Nieto, D. (2025). Impacto de las políticas públicas en la cobertura de educación superior regional en Colombia (2018-2025). Observatorio de Políticas Educativas, 12(2), 45-68.",
    },
    {
      id: "doc-3",
      ano: "2025",
      lineaInvestigacion: "Desarrollo Urbano",
      titulo: "Transformación digital y sostenibilidad en modelos de gestión urbana para ciudades intermedias",
      tipoFuente: "Libro",
      pais: "Chile",
      autores: [
        "Roberto Ignacio Morales",
        "Francisca Javiera Tapia",
      ],
      enlaceDocumento: "#",
      resumen:
        "Modelos innovadores de gobernanza inteligente y planificación territorial aplicados a centros urbanos en crecimiento de América del Sur.",
      referenciaApa:
        "Morales, R. I. & Tapia, F. J. (2025). Transformación digital y sostenibilidad en modelos de gestión urbana para ciudades intermedias. Editorial Territorios Sostenibles.",
    },
    {
      id: "doc-4",
      ano: "2024",
      lineaInvestigacion: "Aprendizaje Virtual",
      titulo: "Tutorías virtuales asistidas y rendimiento académico en redes de aprendizaje universitarias",
      tipoFuente: "Artículo científico",
      pais: "Colombia",
      autores: [
        "Claudia Marcela Pardo",
        "Julián David Gómez",
      ],
      enlaceDocumento: "#",
      resumen:
        "Estudio comparativo sobre el impacto del acompañamiento tutorial pedagógico en entornos asíncronos colaborativos.",
      referenciaApa:
        "Pardo, C. M. & Gómez, J. D. (2024). Tutorías virtuales asistidas y rendimiento académico en redes de aprendizaje universitarias. Revista Latinoamericana de Tecnología Educativa, 19(3), 112-129.",
    },
    {
      id: "doc-5",
      ano: "2024",
      lineaInvestigacion: "Economía Circular",
      titulo: "Estrategias de economía circular aplicadas a cadenas de valor agroindustriales",
      tipoFuente: "Informe técnico",
      pais: "México",
      autores: [
        "Esteban Gutiérrez Vega",
        "Ana Lucía Domínguez",
      ],
      enlaceDocumento: "#",
      resumen:
        "Guía metodológica para la reducción del desperdicio de biomasa y valorización de subproductos en el sector agrícola.",
      referenciaApa:
        "Gutiérrez Vega, E. & Domínguez, A. L. (2024). Estrategias de economía circular aplicadas a cadenas de valor agroindustriales. Centro de Estudios Agroecológicos, 8(1).",
    },
    {
      id: "doc-6",
      ano: "2023",
      lineaInvestigacion: "Gobernanza de Datos",
      titulo: "Marco de gobernanza de datos y privacidad en observatorios socioeconómicos públicos",
      tipoFuente: "Revistas especializadas",
      pais: "Colombia",
      autores: [
        "Felipe Andrés Méndez",
        "Paola Andrea Rincón",
      ],
      enlaceDocumento: "#",
      resumen:
        "Propuesta de arquitectura y protocolos éticos para el almacenamiento, interoperabilidad y apertura de datos institucionales.",
      referenciaApa:
        "Méndez, F. A. & Rincón, P. A. (2023). Marco de gobernanza de datos y privacidad en observatorios socioeconómicos públicos. Revista de Políticas de la Información, 15(4), 88-105.",
    },
  ];

  static async obtenerDocumentos(): Promise<DocumentoRepositorio[]> {
    return this.documentos;
  }

  static async obtenerDocumentoPorId(id: string): Promise<DocumentoRepositorio | undefined> {
    return this.documentos.find((d) => d.id === id);
  }
}
