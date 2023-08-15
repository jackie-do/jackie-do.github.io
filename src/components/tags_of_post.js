import * as React from "react"
// import { siteMetadata } from "../../gatsby-config"

const TagsOfPost = ({ tags }) => {
  const tagNames = tags.map(tag => {
    let convertedTagName = tag.replace(' ', '-')
    return convertedTagName
  })

  return (
    <div className="tag__container">
      { tagNames.map((tagName, index) => {
        return <a key={index} className="tag-item" href={`/tags/${tagName}`}>{ tagName }</a>
      })
      }
    </div>
  )
}

export default TagsOfPost