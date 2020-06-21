import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';
import 'dayjs/locale/ru';
import 'dayjs/locale/tr';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';
import { apis } from '../apis';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale(apis.i18n.getMessage('dayjsLocale'));

export { dayjs };
