import type { SourceId } from './types'

export interface Source {
  id: SourceId
  cite: string
  finding: string
  url: string
}

export const SOURCES: Source[] = [
  {
    id: 'hazards',
    cite: 'NASA Human Research Program. The 5 Hazards of Human Spaceflight.',
    finding: 'Radiation, isolation and confinement, distance from Earth, gravity fields, and hostile closed environments.',
    url: 'https://www.nasa.gov/hrp/hazards/',
  },
  {
    id: 'barger',
    cite: 'Barger LK et al. Lancet Neurology. 2014;13(9):904–912.',
    finding: 'Crews slept about six hours a night on station missions, well under the 8.5 hours scheduled.',
    url: 'https://doi.org/10.1016/S1474-4422(14)70122-X',
  },
  {
    id: 'stahn',
    cite: 'Stahn AC et al. Scientific Reports. 2017;7:16180.',
    finding: 'Core body temperature climbs by about 1 °C over long-duration flight, and more during exercise.',
    url: 'https://doi.org/10.1038/s41598-017-15560-w',
  },
  {
    id: 'crucian',
    cite: 'Crucian BE et al. Frontiers in Immunology. 2018;9:1437.',
    finding: 'Immune regulation shifts in flight and latent viruses can reactivate, raising infection risk on long missions.',
    url: 'https://doi.org/10.3389/fimmu.2018.01437',
  },
  {
    id: 'hughson',
    cite: 'Hughson RL et al. Am J Physiol Heart Circ Physiol. 2016;310(5):H628–H638.',
    finding: 'Six months in orbit increased arterial stiffness and insulin resistance.',
    url: 'https://doi.org/10.1152/ajpheart.00802.2015',
  },
  {
    id: 'lang',
    cite: 'Lang T et al. J Bone Miner Res. 2004;19(6):1006–1012.',
    finding: 'Station crews lost roughly 1 to 1.5 percent of hip bone mass per month.',
    url: 'https://doi.org/10.1359/JBMR.040307',
  },
  {
    id: 'zeitlin',
    cite: 'Zeitlin C et al. Science. 2013;340(6136):1080–1084.',
    finding: 'Curiosity measured about 1.8 mSv per day inside the spacecraft on the way to Mars.',
    url: 'https://doi.org/10.1126/science.1235989',
  },
  {
    id: 'hassler',
    cite: 'Hassler DM et al. Science. 2014;343(6169):1244797.',
    finding: 'Curiosity measured about 0.67 mSv per day on the surface of Mars.',
    url: 'https://doi.org/10.1126/science.1244797',
  },
  {
    id: 'zhang',
    cite: 'Zhang S et al. Science Advances. 2020;6(39):eaaz1334.',
    finding: 'Chang’e 4 measured about 1.37 mSv per day on the lunar surface.',
    url: 'https://doi.org/10.1126/sciadv.aaz1334',
  },
  {
    id: 'std3001',
    cite: 'NASA-STD-3001 Vol. 1, Crew Health. NASA Space Flight Human-System Standard.',
    finding: 'Sets a career radiation limit of 600 mSv and the medical care levels required by mission type.',
    url: 'https://www.nasa.gov/directorates/esdmd/hhp/human-spaceflight-and-aviation-standards/',
  },
]

export function getSource(id: SourceId): Source {
  return SOURCES.find((s) => s.id === id)!
}
