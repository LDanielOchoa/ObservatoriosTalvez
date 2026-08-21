import type { SolicitudInscripcionRed } from "./inscripciones.types";

/**
 * Servicio encargado de gestionar las solicitudes de inscripción a la Red de Aprendizaje
 */
export class ServicioInscripcionesRed {
  private static solicitudes: SolicitudInscripcionRed[] = [
    {
      id: "sol-101",
      nombre: "Valentina Gómez Duque",
      cedula: "1094827163",
      telefono: "316 482 9102",
      fechaNacimiento: "14 de Febrero, 2002",
      universidad: "Universidad de Antioquia",
      carrera: "Trabajo Social",
      semestre: "6° Semestre",
      fechaSolicitud: "2026-08-21",
      estado: "Pendiente",
    },
    {
      id: "sol-102",
      nombre: "Mateo Sebastián Bermúdez",
      cedula: "1083928174",
      telefono: "301 928 4710",
      fechaNacimiento: "28 de Mayo, 2001",
      universidad: "Pontificia Universidad Javeriana",
      carrera: "Ecología y Medio Ambiente",
      semestre: "8° Semestre",
      fechaSolicitud: "2026-08-20",
      estado: "Pendiente",
    },
    {
      id: "sol-103",
      nombre: "Camila Andrea Mendoza",
      cedula: "1072918274",
      telefono: "314 782 9104",
      fechaNacimiento: "10 de Octubre, 2003",
      universidad: "Universidad del Rosario",
      carrera: "Jurisprudencia y Derecho",
      semestre: "4° Semestre",
      fechaSolicitud: "2026-08-20",
      estado: "Pendiente",
    },
    {
      id: "sol-104",
      nombre: "Felipe Andrés Cardona",
      cedula: "1061928374",
      telefono: "322 819 3019",
      fechaNacimiento: "03 de Agosto, 2000",
      universidad: "Universidad Nacional de Colombia",
      carrera: "Ingeniería Química",
      semestre: "9° Semestre",
      fechaSolicitud: "2026-08-19",
      estado: "Pendiente",
    },
    {
      id: "sol-105",
      nombre: "Sofía Lorena Quintero",
      cedula: "1059281726",
      telefono: "318 472 9182",
      fechaNacimiento: "19 de Marzo, 2002",
      universidad: "Universidad del Valle",
      carrera: "Licenciatura en Ciencias Sociales",
      semestre: "7° Semestre",
      fechaSolicitud: "2026-08-19",
      estado: "Pendiente",
    },
    {
      id: "sol-106",
      nombre: "Nicolás David Pardo",
      cedula: "1048291029",
      telefono: "310 928 1749",
      fechaNacimiento: "25 de Diciembre, 2001",
      universidad: "Universidad de Los Andes",
      carrera: "Economía y Políticas Públicas",
      semestre: "8° Semestre",
      fechaSolicitud: "2026-08-18",
      estado: "Pendiente",
    },
    {
      id: "sol-107",
      nombre: "Mariana Lucía Henao",
      cedula: "1039281928",
      telefono: "313 748 1920",
      fechaNacimiento: "08 de Junio, 2003",
      universidad: "Universidad EAFIT",
      carrera: "Negocios Internacionales",
      semestre: "5° Semestre",
      fechaSolicitud: "2026-08-17",
      estado: "Aprobado",
    },
    {
      id: "sol-108",
      nombre: "Julián Esteban Vargas",
      cedula: "1028192837",
      telefono: "319 829 1029",
      fechaNacimiento: "17 de Septiembre, 2000",
      universidad: "Universidad del Norte",
      carrera: "Ingeniería Industrial",
      semestre: "10° Semestre",
      fechaSolicitud: "2026-08-16",
      estado: "Rechazado",
    },
  ];

  static async obtenerSolicitudes(): Promise<SolicitudInscripcionRed[]> {
    return this.solicitudes;
  }
}
