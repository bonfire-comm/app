import Message from '../classes/message';

export default function coupleMessages(messages: Message[]) {
  return messages
    .reduce((acc, message) => {
      const last = acc[acc.length - 1];
      if (!last) {
        return acc.concat([[message]]);
      }

      const lastMessage = last[last.length - 1];
      if (
        message.author === lastMessage.author
        && message.createdAt.getTime() - lastMessage.createdAt.getTime() <= 1000 * 60 * 5
        && last.length < 10
        && !message.replyTo
      ) {
        last.push(message);
      } else {
        acc.push([message]);
      }

      return acc;
    }, [] as Message[][]);
}