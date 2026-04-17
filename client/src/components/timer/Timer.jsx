import Digit from './Digit'

const Timer = ({ seconds, minutes, hours }) => {
  return (
    <>
      <Digit value={hours} />
      :
      <Digit value={minutes} />
      :
      <Digit value={seconds} />
    </>
  )
}

export default Timer
