import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import isBetween from 'dayjs/plugin/isBetween'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.extend(isBetween)
dayjs.locale('vi')

export default dayjs
