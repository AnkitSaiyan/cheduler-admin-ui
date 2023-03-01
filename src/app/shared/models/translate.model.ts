import {DUTCH_BE, ENG_BE} from "../utils/const";

export const Translate = Object.freeze({
  // Table Headers
  FirstName: {
    [ENG_BE]: 'First Name',
    [DUTCH_BE]: 'Voornaam',
  },
  LastName: {
    [ENG_BE]: 'Last Name',
    [DUTCH_BE]: 'Naam',
  },
  Email: {
    [ENG_BE]: 'Email',
    [DUTCH_BE]: 'E-mail',
  },
  Status: {
    [ENG_BE]: 'Status',
    [DUTCH_BE]: 'Status',
  },
  Actions: {
    [ENG_BE]: 'Actions',
    [DUTCH_BE]: 'Acties',
  },

  // Statuses
  Active: {
    [ENG_BE]: 'Active',
    [DUTCH_BE]: 'Actief',
  },

  Inactive: {
    [ENG_BE]: 'Inactive',
    [DUTCH_BE]: 'Inactief',
  },

  // Toast Messages
  DownloadSuccess: (filetype) => ({
      [ENG_BE]: `${filetype} file downloaded successfully`,
      [DUTCH_BE]: `${filetype} bestand succesvol gedownload`,
  })
});
