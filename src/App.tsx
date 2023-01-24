import React, { FC, useEffect, useState } from 'react';
import { createDeliveryClient, ElementModels, Elements, ElementType, IContentItem } from "@kontent-ai/delivery-sdk";
import { useParams } from "react-router";

type Params = Readonly<{
  itemCodename: string;
  languageCodename: string;
}>;

const storageKey = 'myTestKey';

export const App: FC = () => {
  const params = useParams<Params>();
  const [item, setItem] = useState<IContentItem | null>(null);
  const [storedNum, setStoredNum] = useState<number | null>(null);

  useEffect(() => {
    document.cookie = "someTest=someValue; SameSite=None; secure";
  }, []);

  useEffect(() => {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) {
      setStoredNum(Number(existing));
      return;
    }
    const newNum = Math.ceil(Math.random() * 100);
    window.localStorage.setItem(storageKey, newNum.toString());
    setStoredNum(newNum);
  }, []);


  useEffect(() => {
    if (!params.itemCodename || !params.languageCodename) {
      throw new Error('Invalid route, item or language codename is missing.');
    }

    client
      .item(params.itemCodename)
      .languageParameter(params.languageCodename)
      .queryConfig({ usePreviewMode: true })
      .toPromise()
      .then(res => setItem(res.data.item));
  }, [params.itemCodename, params.languageCodename]);

  if (item === null) {
    return (
      <h1>Loading...</h1>
    );
  }

  return (
    <>
      {storedNum === null ? <div>Nothing is stored.</div> : storedNum}
      <h1>Item: </h1>
      {Object.entries(item.elements).map(([codename, el]) => (
        <Element key={codename} el={el} />
      ))}
    </>
  );
};

const Element = ({ el }: { readonly el: ElementModels.IElement<unknown> }) => {
  switch (el.type) {
    case ElementType.Asset: {
      const elTyped = el as Elements.AssetsElement;

      return (
        <section>
          <ElementHeader element={el} />
          {elTyped.value.map((asset, index) => (
            <img
              key={index}
              src={asset.url}
              alt={asset.description ?? ''}
              width={asset.width ?? undefined}
              height={asset.height ?? undefined}
            />
          ))}
        </section>
      );
    }
    case ElementType.ModularContent: {
      const elTyped = el as Elements.LinkedItemsElement;

      return (
        <section>
          <ElementHeader element={el} />
          <StringValue value={elTyped.value.join(', ')} />
        </section>
      );
    }
    case ElementType.MultipleChoice: {
      const elTyped = el as Elements.MultipleChoiceElement;

      return (
        <section>
          <ElementHeader element={el} />
          <StringValue value={elTyped.value.map(c => `${c.name};${c.codename}`).join(', ')} />
        </section>
      );
    }
    case ElementType.Number: {
      const elTyped = el as Elements.NumberElement;

      return (
        <section>
          <ElementHeader element={el} />
          <StringValue value={elTyped.value?.toString() ?? ''} />
        </section>
      );
    }
    case ElementType.Custom:
    case ElementType.DateTime:
    case ElementType.Text:
    case ElementType.UrlSlug:
    case ElementType.RichText: {
      const elTyped = el as Elements.RichTextElement | Elements.CustomElement | Elements.DateTimeElement | Elements.TextElement | Elements.UrlSlugElement;

      return (
        <section>
          <ElementHeader element={el} />
          <StringValue value={elTyped.value ?? ''} />
        </section>
      );
    }
    case ElementType.Taxonomy: {
      const elTyped = el as Elements.TaxonomyElement;

      return (
        <section>
          <ElementHeader element={el} />
          <StringValue value={elTyped.value.map(term => `${term.name};${term.codename}`).join(', ')} />
        </section>
      );
    }
    default:
      throw new Error(`Unknown element type: ${el.type}`);
  }
}

const StringValue = (props: { readonly value: string }) => (
  <p>value: {props.value}</p>
);

const ElementHeader = (props: { readonly element: ElementModels.IElement<unknown> }) => (
  <h3>type: {props.element.type}, name: {props.element.name}</h3>
);

const client = createDeliveryClient({
  projectId: '25096f15-2b2c-00ba-d1c0-c7ca45671732',
  previewApiKey: process.env['REACT_APP_previewApiKey'],
});
