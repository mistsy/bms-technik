import audit from '../../generated/audit-data.json';

export const business = audit.business;
export const origin = audit.origin;
export const media = '/wp-content/uploads/';
export const logo = media + '2022/03/logo.svg';
export const phone = { text: '604 959 993', href: 'tel:604959993' };
export const emails = ['biuro@bmstechnik.pl', 'm.adamek@bmstechnik.pl'];
export const addresses = ['ul. Szewska 8, 32-043 Skała', 'ul. Sikorki 23/14, 31-589 Kraków'];
export const navigation = [
  { label: 'Rekuperacja / Wentylacja', href: '/rekuperacja/' },
  { label: 'Klimatyzacja', href: '/klimatyzacja/' },
  { label: 'Kontakt', href: '/kontakt/' },
];

const ventilationAlts = [
  'Centrala wentylacyjna z izolowanymi przewodami na poddaszu',
  'Izolowany przewód wentylacyjny wzdłuż połaci dachu',
  'Połączenie izolowanych przewodów wentylacyjnych na poddaszu',
  'Izolowane przewody wentylacyjne pod drewnianą więźbą dachową',
  'Zbliżenie centrali wentylacyjnej z podłączonymi przewodami',
];
const airConditioningAlts = [
  'Jednostka zewnętrzna klimatyzacji zamocowana na ścianie balkonu',
  'Klimatyzator ścienny nad dekoracyjnym zegarem w pomieszczeniu',
  'Klimatyzator kasetonowy w suficie nad drewnianymi panelami',
  'Klimatyzator kasetonowy w suficie nad ekranem projekcyjnym',
  'Jednostka zewnętrzna klimatyzacji ustawiona na kostce przy ścianie',
];
export const ventilation = audit.galleries['/rekuperacja/'].map((photo, i) => ({ ...photo, alt: ventilationAlts[i] }));
export const airConditioning = audit.galleries['/klimatyzacja/'].map((photo, i) => ({ ...photo, alt: airConditioningAlts[i] }));
