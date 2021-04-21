exports.activeProbability = function activeProbability(onVector) {
    console.log("onVector:"+typeof(onVector));
    let probVector = [];
    let activeIndex = [];

    /* Find the indexes with an on state in the onVector */
    for (let i = 0; i < onVector.length; i++) {
      if (onVector[i] === 1) {
        activeIndex.push(i)
      }
    }
    //activeIndex => [1, 9, 18]
    activeIndex = activeIndex.map(n => n * 12);

    //activeIndex => [12, (108), (216)]

    /* Find the index distance to the next active  */
    for (let i = 0; i < 24 * 12; i++) {
      probVector[i] = Math.min(...activeIndex.map(n => {
        return (Math.abs(n - i)) / 6
      }))
    }
    /* gaussian function */
    probVector = probVector.map(x => {
      return ((Math.exp(-(x ** 2)).toFixed(4)));
    })
    console.log("probVector:"+typeof(probVector));
    return probVector;
}