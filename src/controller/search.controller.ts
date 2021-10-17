import express from 'express';
import { KMR } from "koalanlp/API";
import { Tagger } from "koalanlp/proc";
import { Keyword } from '../models/Keyword';
import { Op } from 'sequelize';
import { Link } from '../models/Link';

const router = express.Router();

type FrequentLink = {
    // 찾은 Keyword의 URL
    url: string;
    // Link Table의 Description
    content: string;
    // 키워드와 Link의 개수 파악
    count: number;
};

router.get('/', async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json();
    }

    const tagger = new Tagger(KMR);
    const tagged = await tagger(q);
    const searchKeywords: Set<string> = new Set();

    for (const sent of tagged) {
        for (const word of sent._items) {
            for (const morpheme of word._items) {
                if (morpheme._tag === "NNG" || morpheme._tag === "NNP" ||
                    morpheme._tag === "NNB" || morpheme._tag === "NP" || morpheme._tag === "NR" ||
                    morpheme._tag === "VV" || morpheme._tag === "SL") {
                    const keyword = morpheme._surface.toLowerCase();
                    searchKeywords.add(keyword);
                }
            }
        }
    }

    // 형태소 분석을 수행한 단어들을 배열로 전환
    const morphemeKeywords = Array.from(searchKeywords.values());
    /* 분석이 된 단어들을 Database에 존재하는지 찾고
    찾은 데이터의 Link를 사용자에게 전달
    */
    const keywords = await Keyword.findAll({
        where: {
            name: {
                [Op.in]: morphemeKeywords,
            },
        },
        include: [
            {
                model: Link,
            },
        ],
    });

    // 검색 순위를 정렬하기 위해서는 우선 검색 결과에 따른 URL을 counting
    const frequentLink = new Map<string, FrequentLink>();
    keywords.forEach((keyword) => {
        keyword.links.forEach((link) => {
            const exist = frequentLink.get(link.url);
            if (exist) {
                exist.count += 1;
                frequentLink.set(link.url, exist);
            } else {
                frequentLink.set(link.url, {
                    url: link.url,
                    content: link.description,
                    count: 1,
                });
            }
        });
    });

    // counting한 결과를 정렬
    const result = Array.from(frequentLink.values()).sort(
        (link1, link2) => link2.count - link1.count
    );

    return res.status(200).json(result);
});

export default router;