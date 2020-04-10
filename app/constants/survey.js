const survey = [
  {
    title: 'Do you know or believe you have COVID-19?',
    bodyText:
      'If you are showing the symptoms of COVID-19, even if there may be a chance that it could be something else, select Yes below.',
    buttonOptions: ['No', 'Yes'],
    datePicker: false,
  },
  {
    title: 'When did you first start showing symptoms?',
    buttonOptions: ['Next'],
    datePicker: true,
  },
  {
    title: 'Export Location History',
    bodyText:
      'Exporting your location history will be crucial for your community to keep up-to-date information on what places have been exposed to COVID-19. All of your location data remains anonymous.',
    buttonOptions: ['Submit'],
    datePicker: false,
  },
];

export default survey;
