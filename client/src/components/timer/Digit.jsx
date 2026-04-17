const Digit = ({ value }) => {
  const leftDigit = value >= 10 ? value.toString()[0] : '0'
  const rightDigit = value >= 10 ? value.toString()[1] : value.toString()

  return (
    <>
      <span>{leftDigit}</span>
      <span>{rightDigit}</span>
    </>
  )
}

export default Digit
